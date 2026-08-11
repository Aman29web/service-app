import { z } from "zod";
import { prisma } from "../config/db.js";

const slotsQuerySchema = z.object({
  offeringId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const saveRulesSchema = z.object({
  offeringId: z.string().min(1),
  rules: z.array(
    z.object({
      weekday: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
      enabled: z.boolean(),
      windows: z.array(
        z.object({
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          capacity: z.number().int().positive(),
        })
      ),
    })
  ),
  exceptions: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(["CLOSED", "OPEN"]),
      windows: z.array(
        z.object({
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          capacity: z.number().int().positive(),
        })
      ),
    })
  ),
});

function parseTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(`${date}T${time}:00`);

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  result.setHours(hours, minutes, 0, 0);
  return result;
}

function buildSlots({ date, windows, durationMinutes, bookingCountMap }) {
  const slots = [];
  const now = new Date();

  for (const window of windows) {
    const start = parseTime(date, window.startTime);
    const end = parseTime(date, window.endTime);

    if (!start || !end || end <= start) continue;

    let current = new Date(start);

    while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
      const isoStart = current.toISOString();
      const bookingCount = bookingCountMap[isoStart] || 0;
      const remainingCapacity = window.capacity - bookingCount;
      const available = remainingCapacity > 0 && current.getTime() >= now.getTime();

      slots.push({
        id: `${date}-${window.startTime}-${current.getHours()}-${current.getMinutes()}`,
        start: isoStart,
        startTime: window.startTime,
        endTime: new Date(current.getTime() + durationMinutes * 60000).toISOString(),
        remainingCapacity,
        capacity: window.capacity,
        available,
      });

      current = new Date(current.getTime() + durationMinutes * 60000);
    }
  }

  return slots;
}

async function findOfferingWithStructure(offeringId) {
  return prisma.offering.findUnique({
    where: { id: offeringId },
    include: {
      service: { include: { vendor: true, category: true } },
      availabilityRules: true,
      availabilityExceptions: true,
    },
  });
}

function findExceptionForDate(exceptions, date) {
  return exceptions.find((exception) => exception.date.toISOString().slice(0, 10) === date);
}

export async function getSlots(req, res, next) {
  try {
    const query = slotsQuerySchema.parse(req.query);

    const offering = await findOfferingWithStructure(query.offeringId);

    if (!offering || offering.service.status !== "PUBLISHED" || offering.service.vendor.status !== "APPROVED") {
      return res.status(404).json({ success: false, message: "Offering not available." });
    }

    const exception = findExceptionForDate(offering.availabilityExceptions, query.date);
    let windows = [];

    if (exception) {
      if (exception.type === "CLOSED") {
        windows = [];
      } else {
        windows = exception.windows;
      }
    } else {
      const weekday = new Date(`${query.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const rule = offering.availabilityRules.find((item) => item.weekday === weekday);

      if (rule?.enabled) {
        windows = rule.windows;
      }
    }

    if (!windows || windows.length === 0) {
      return res.json({ success: true, data: { slots: [], service: offering.service, offering } });
    }

    const startTimes = windows.flatMap((window) => {
      const slots = [];
      const start = parseTime(query.date, window.startTime);
      const end = parseTime(query.date, window.endTime);
      if (!start || !end) return [];
      let current = new Date(start);
      while (current.getTime() + offering.durationMinutes * 60000 <= end.getTime()) {
        slots.push(current.toISOString());
        current = new Date(current.getTime() + offering.durationMinutes * 60000);
      }
      return slots;
    });

    const bookings = await prisma.booking.findMany({
      where: {
        offeringId: query.offeringId,
        startTime: { in: startTimes.map((item) => new Date(item)) },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const bookingCountMap = bookings.reduce((acc, booking) => {
      const key = booking.startTime.toISOString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const slots = buildSlots({
      date: query.date,
      windows,
      durationMinutes: offering.durationMinutes,
      bookingCountMap,
    });

    return res.json({ success: true, data: { slots, service: offering.service, offering } });
  } catch (error) {
    next(error);
  }
}

export async function getNextAvailableSlot(req, res, next) {
  try {
    const serviceId = req.params.serviceId;
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { vendor: true, offerings: true },
    });

    if (!service || service.status !== "PUBLISHED" || service.vendor.status !== "APPROVED") {
      return res.status(404).json({ success: false, message: "Service not available." });
    }

    const offeringId = req.query.offeringId || service.offerings[0]?.id;
    if (!offeringId) {
      return res.status(400).json({ success: false, message: "No offering available." });
    }

    const offering = await findOfferingWithStructure(offeringId);
    if (!offering) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    const daysToCheck = 14;
    const today = new Date();

    for (let offset = 0; offset < daysToCheck; offset += 1) {
      const nextDate = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
      const isoDate = nextDate.toISOString().slice(0, 10);
      const exception = findExceptionForDate(offering.availabilityExceptions, isoDate);
      let windows = [];

      if (exception) {
        if (exception.type === "CLOSED") {
          windows = [];
        } else {
          windows = exception.windows;
        }
      } else {
        const weekday = new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
        }).toUpperCase();
        const rule = offering.availabilityRules.find((item) => item.weekday === weekday);
        if (rule?.enabled) {
          windows = rule.windows;
        }
      }

      const startTimes = windows.flatMap((window) => {
        const slots = [];
        const start = parseTime(isoDate, window.startTime);
        const end = parseTime(isoDate, window.endTime);
        if (!start || !end) return [];
        let current = new Date(start);
        while (current.getTime() + offering.durationMinutes * 60000 <= end.getTime()) {
          if (current.getTime() >= new Date().getTime()) {
            slots.push(current.toISOString());
          }
          current = new Date(current.getTime() + offering.durationMinutes * 60000);
        }
        return slots;
      });

      if (startTimes.length === 0) continue;

      const bookings = await prisma.booking.findMany({
        where: {
          offeringId,
          startTime: { in: startTimes.map((item) => new Date(item)) },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      const bookingCountMap = bookings.reduce((acc, booking) => {
        const key = booking.startTime.toISOString();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const slots = buildSlots({
        date: isoDate,
        windows,
        durationMinutes: offering.durationMinutes,
        bookingCountMap,
      });

      const nextAvailable = slots.find((slot) => slot.available);
      if (nextAvailable) {
        return res.json({ success: true, data: { slot: nextAvailable } });
      }
    }

    return res.json({ success: true, data: { slot: null } });
  } catch (error) {
    next(error);
  }
}

export async function getAvailabilityRules(req, res, next) {
  try {
    const offeringId = req.query.offeringId;
    if (!offeringId || typeof offeringId !== "string") {
      return res.status(400).json({ success: false, message: "offeringId is required." });
    }

    const offering = await prisma.offering.findUnique({
      where: { id: offeringId },
      include: {
        service: { include: { vendor: true } },
        availabilityRules: true,
        availabilityExceptions: true,
      },
    });

    if (!offering || offering.service.vendor.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    return res.json({
      success: true,
      data: {
        rules: offering.availabilityRules,
        exceptions: offering.availabilityExceptions,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveAvailabilityRules(req, res, next) {
  try {
    const payload = saveRulesSchema.parse(req.body);

    const offering = await prisma.offering.findUnique({
      where: { id: payload.offeringId },
      include: { service: { include: { vendor: true } } },
    });

    if (!offering || offering.service.vendor.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { offeringId: payload.offeringId } }),
      prisma.availabilityException.deleteMany({ where: { offeringId: payload.offeringId } }),
      prisma.availabilityRule.createMany({
        data: payload.rules.map((rule) => ({
          offeringId: payload.offeringId,
          weekday: rule.weekday,
          enabled: rule.enabled,
          windows: JSON.stringify(rule.windows),
        })),
      }),
      prisma.availabilityException.createMany({
        data: payload.exceptions.map((exception) => ({
          offeringId: payload.offeringId,
          date: new Date(`${exception.date}T00:00:00`),
          type: exception.type,
          windows: JSON.stringify(exception.windows),
        })),
      }),
    ]);

    return res.json({ success: true, data: { message: "Availability updated successfully." } });
  } catch (error) {
    next(error);
  }
}

export async function addAvailabilityException(req, res, next) {
  try {
    const payload = z.object({
      offeringId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(["CLOSED", "OPEN"]),
      windows: z.array(
        z.object({
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          capacity: z.number().int().positive(),
        })
      ),
    }).parse(req.body);

    const offering = await prisma.offering.findUnique({
      where: { id: payload.offeringId },
      include: { service: { include: { vendor: true } } },
    });

    if (!offering || offering.service.vendor.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    const exception = await prisma.availabilityException.create({
      data: {
        offeringId: payload.offeringId,
        date: new Date(`${payload.date}T00:00:00`),
        type: payload.type,
        windows: JSON.stringify(payload.windows),
      },
    });

    return res.status(201).json({ success: true, data: exception });
  } catch (error) {
    next(error);
  }
}

export async function deleteAvailabilityException(req, res, next) {
  try {
    const id = req.params.id;
    const exception = await prisma.availabilityException.findUnique({ where: { id } });

    if (!exception) {
      return res.status(404).json({ success: false, message: "Exception not found." });
    }

    const offering = await prisma.offering.findUnique({
      where: { id: exception.offeringId },
      include: { service: { include: { vendor: true } } },
    });

    if (!offering || offering.service.vendor.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await prisma.availabilityException.delete({ where: { id } });

    return res.json({ success: true, data: { message: "Exception removed." } });
  } catch (error) {
    next(error);
  }
}

export async function getVendorAvailability(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        services: { include: { offerings: true } },
      },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    return res.json({ success: true, data: { vendor } });
  } catch (error) {
    next(error);
  }
}
