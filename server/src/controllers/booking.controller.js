import { z } from "zod";
import { prisma } from "../config/db.js";

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  offeringId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  paymentMode: z.enum(["PAY_NOW", "PAY_AFTER"]),
});

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

function parseDateTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const dt = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function getWindowForSlot(windows, date, startTime, durationMinutes) {
  const desired = parseDateTime(date, startTime);
  if (!desired) return null;

  for (const window of windows) {
    const start = parseDateTime(date, window.startTime);
    const end = parseDateTime(date, window.endTime);
    if (!start || !end || end <= start) continue;
    if (desired < start || desired.getTime() + durationMinutes * 60000 > end.getTime()) continue;
    const diff = (desired.getTime() - start.getTime()) / 60000;
    if (diff % durationMinutes !== 0) continue;
    return window;
  }

  return null;
}

function formatBooking(booking) {
  return {
    ...booking,
    amount: Math.round(booking.amount / 100),
  };
}

export async function createBooking(req, res, next) {
  try {
    const payload = createBookingSchema.parse(req.body);
    const userId = req.user.id;
    const now = new Date();

    const service = await prisma.service.findUnique({
      where: { id: payload.serviceId },
      include: { vendor: true, offerings: { where: { id: payload.offeringId } } },
    });

    if (!service || service.status !== "PUBLISHED" || service.vendor.status !== "APPROVED") {
      return res.status(404).json({ success: false, message: "Service not available." });
    }

    const offering = service.offerings[0];
    if (!offering) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    const offeringWithAvailability = await prisma.offering.findUnique({
      where: { id: payload.offeringId },
      include: { availabilityRules: true, availabilityExceptions: true },
    });

    if (!offeringWithAvailability) {
      return res.status(404).json({ success: false, message: "Offering not found." });
    }

    const exception = offeringWithAvailability.availabilityExceptions.find(
      (item) => item.date.toISOString().slice(0, 10) === payload.date
    );
    let windows = [];
    if (exception) {
      if (exception.type === "CLOSED") {
        windows = [];
      } else {
        windows = JSON.parse(exception.windows);
      }
    } else {
      const weekday = new Date(`${payload.date}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
      }).toUpperCase();
      const rule = offeringWithAvailability.availabilityRules.find((item) => item.weekday === weekday);
      if (rule?.enabled) {
        windows = JSON.parse(rule.windows);
      }
    }

    const window = getWindowForSlot(windows, payload.date, payload.startTime, offering.durationMinutes);
    if (!window) {
      return res.status(400).json({ success: false, message: "Selected slot is not available." });
    }

    const startTime = parseDateTime(payload.date, payload.startTime);
    const endTime = new Date(startTime.getTime() + offering.durationMinutes * 60000);
    if (startTime < now) {
      return res.status(400).json({ success: false, message: "Cannot book a past slot." });
    }

    const booking = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offering" WHERE id = ${payload.offeringId} FOR UPDATE`;

      const existingCount = await tx.booking.count({
        where: {
          offeringId: payload.offeringId,
          startTime,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (existingCount >= window.capacity) {
        throw { status: 400, message: "Slot is no longer available." };
      }

      const booking = await tx.booking.create({
        data: {
          serviceId: payload.serviceId,
          offeringId: payload.offeringId,
          customerId: userId,
          vendorId: service.vendor.id,
          date: new Date(`${payload.date}T00:00:00Z`),
          startTime,
          endTime,
          amount: offering.price,
          paymentMode: payload.paymentMode,
          status: payload.paymentMode === "PAY_AFTER" ? "CONFIRMED" : "PENDING",
          history: {
            create: {
              status: payload.paymentMode === "PAY_AFTER" ? "CONFIRMED" : "PENDING",
              note: payload.paymentMode === "PAY_AFTER" ? "Auto-confirmed for PAY_AFTER" : "Awaiting payment confirmation.",
            },
          },
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: offering.price,
          mode: payload.paymentMode,
          status: "INITIATED",
          providerReference: `PAYMENT-${booking.id}`,
        },
      });

      return booking;
    });

    return res.status(201).json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const query = z.object({ page: z.string().optional(), status: z.string().optional() }).parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = { customerId: req.user.id, ...(query.status ? { status: query.status } : {}) };

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: { service: true, offering: true, vendor: true, payment: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        bookings: bookings.map((booking) => ({ ...formatBooking(booking) })),
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { service: true, offering: true, vendor: true, customer: true, payment: true, history: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (req.user.id !== booking.customerId && req.user.id !== booking.vendor?.userId) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    return res.json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { reason } = cancelSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });

    if (!booking || booking.customerId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel booking in current status." });
    }

    const now = new Date();
    const allowed = now.getTime() <= booking.startTime.getTime() - booking.cancellationWindowHours * 60 * 60000;
    const paymentUpdates = {};

    if (booking.payment?.status === "SUCCESS" && allowed) {
      paymentUpdates.status = "REFUNDED";
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || "Cancelled by customer.",
        payment: paymentUpdates.status ? { update: paymentUpdates } : undefined,
        history: {
          create: {
            status: "CANCELLED",
            note: reason || (allowed ? "Cancelled before cutoff." : "Cancelled within cutoff."),
          },
        },
      },
    });

    return res.json({ success: true, data: formatBooking(updated) });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleBooking(req, res, next) {
  try {
    const payload = rescheduleSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { offering: true, service: true },
    });

    if (!booking || booking.customerId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Cannot reschedule booking in current status." });
    }

    const offering = await prisma.offering.findUnique({
      where: { id: booking.offeringId },
      include: { availabilityRules: true, availabilityExceptions: true },
    });

    const exception = offering.availabilityExceptions.find(
      (item) => item.date.toISOString().slice(0, 10) === payload.date
    );
    let windows = [];
    if (exception) {
      if (exception.type === "CLOSED") {
        windows = [];
      } else {
        windows = JSON.parse(exception.windows);
      }
    } else {
      const weekday = new Date(`${payload.date}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
      }).toUpperCase();
      const rule = offering.availabilityRules.find((item) => item.weekday === weekday);
      if (rule?.enabled) {
        windows = JSON.parse(rule.windows);
      }
    }

    const window = getWindowForSlot(windows, payload.date, payload.startTime, offering.durationMinutes);
    if (!window) {
      return res.status(400).json({ success: false, message: "Selected slot is not available." });
    }

    const startTime = parseDateTime(payload.date, payload.startTime);
    const endTime = new Date(startTime.getTime() + offering.durationMinutes * 60000);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offering" WHERE id = ${offering.id} FOR UPDATE`;

      const existingCount = await tx.booking.count({
        where: {
          offeringId: offering.id,
          startTime,
          status: { in: ["PENDING", "CONFIRMED"] },
          NOT: { id: booking.id },
        },
      });

      if (existingCount >= window.capacity) {
        throw { status: 400, message: "Slot is no longer available." };
      }

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          date: new Date(`${payload.date}T00:00:00Z`),
          startTime,
          endTime,
          history: {
            create: {
              status: booking.status,
              note: `Rescheduled to ${payload.date} ${payload.startTime}`,
            },
          },
        },
      });

      return updatedBooking;
    });

    return res.json({ success: true, data: formatBooking(updated) });
  } catch (error) {
    next(error);
  }
}

export async function getVendorBookings(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const query = z.object({ page: z.string().optional(), status: z.string().optional() }).parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = { vendorId: vendor.id, ...(query.status ? { status: query.status } : {}) };

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: { customer: true, service: true, offering: true, payment: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        bookings: bookings.map((booking) => ({ ...formatBooking(booking) })),
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateVendorBookingStatus(req, res, next, newStatus, note) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const booking = await prisma.booking.findUnique({where: { id: req.params.id }});
    if (!booking || booking.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const allowedTransitions = {
      confirm: ["PENDING"],
      reject: ["PENDING"],
      complete: ["CONFIRMED"],
      noShow: ["CONFIRMED"],
    };

    const allowed = allowedTransitions[newStatus];
    if (!allowed.includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot ${newStatus} booking from current status.` });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: newStatus === "confirm" ? "CONFIRMED" : newStatus === "reject" ? "REJECTED" : newStatus === "complete" ? "COMPLETED" : "NO_SHOW",
        history: {
          create: {
            status: newStatus === "confirm" ? "CONFIRMED" : newStatus === "reject" ? "REJECTED" : newStatus === "complete" ? "COMPLETED" : "NO_SHOW",
            note,
          },
        },
      },
    });

    return res.json({ success: true, data: formatBooking(updated) });
  } catch (error) {
    next(error);
  }
}

export async function vendorConfirmBooking(req, res, next) {
  return updateVendorBookingStatus(req, res, next, "confirm", "Vendor confirmed booking.");
}

export async function vendorRejectBooking(req, res, next) {
  const reason = req.body.reason || "Rejected by vendor.";
  return updateVendorBookingStatus(req, res, next, "reject", reason);
}

export async function vendorCompleteBooking(req, res, next) {
  return updateVendorBookingStatus(req, res, next, "complete", "Vendor completed booking.");
}

export async function vendorNoShowBooking(req, res, next) {
  return updateVendorBookingStatus(req, res, next, "noShow", "Vendor marked no-show.");
}
