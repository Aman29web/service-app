import { z } from "zod";
import { prisma } from "../config/db.js";

const updateProfileSchema = z.object({
  name: z.string().min(1),
  businessName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function getVendorDashboard(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
      include: { services: { include: { bookings: true } } },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    const services = vendor.services;
    const totalServices = services.length;
    const publishedServices = services.filter((service) => service.status === "PUBLISHED").length;

    const bookings = await prisma.booking.findMany({
      where: { vendorId: vendor.id, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
    });

    return res.json({
      success: true,
      data: {
        vendorStatus: vendor.status,
        totalServices,
        publishedServices,
        pendingBookings: bookings.filter((b) => b.status === "PENDING").length,
        confirmedBookings: bookings.filter((b) => b.status === "CONFIRMED").length,
        completedBookings: bookings.filter((b) => b.status === "COMPLETED").length,
        revenue: bookings.reduce((sum, b) => sum + b.amount, 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVendorProfile(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    return res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
}

export async function updateVendorProfile(req, res, next) {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const updated = await prisma.vendorProfile.update({
      where: { userId: req.user.id },
      data: { ...payload },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function getVendorServices(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const services = await prisma.service.findMany({
      where: { vendorId: vendor.id },
      include: { category: true, offerings: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: { services } });
  } catch (error) {
    next(error);
  }
}

export async function getVendorServiceById(req, res, next) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const service = await prisma.service.findFirst({
      where: { id: req.params.id, vendorId: vendor.id },
      include: { category: true, offerings: true },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.json({ success: true, data: service });
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

    const query = z.object({
      page: z.string().optional(),
      status: z.string().optional(),
    }).parse(req.query);

    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = {
      vendorId: vendor.id,
      ...(query.status ? { status: query.status } : {}),
    };

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
      data: { bookings, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    next(error);
  }
}

async function updateBookingStatus(req, res, next, status, note) {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const validTransitions = {
      confirm: ["PENDING"],
      reject: ["PENDING"],
      complete: ["CONFIRMED"],
      noShow: ["CONFIRMED"],
    };

    const action = status;
    const allowed = validTransitions[action];
    if (!allowed.includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot ${action} booking in current status.` });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: status === "confirm" ? "CONFIRMED" : status === "reject" ? "REJECTED" : status === "complete" ? "COMPLETED" : "NO_SHOW" },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: updated.id,
        status: updated.status,
        note,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function vendorConfirmBooking(req, res, next) {
  return updateBookingStatus(req, res, next, "confirm", "Confirmed by vendor.");
}

export async function vendorRejectBooking(req, res, next) {
  const reason = req.body.reason || "Rejected by vendor.";
  return updateBookingStatus(req, res, next, "reject", reason);
}

export async function vendorCompleteBooking(req, res, next) {
  return updateBookingStatus(req, res, next, "complete", "Completed by vendor.");
}

export async function vendorNoShowBooking(req, res, next) {
  return updateBookingStatus(req, res, next, "noShow", "Marked no-show by vendor.");
}
export async function getVendorAvailability(req, res, next) {
  try {
    const payload = z.object({
      offeringId: z.string().min(1),
    }).parse(req.query);

    const offering = await prisma.offering.findUnique({
      where: { id: payload.offeringId },
      include: {
        service: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!offering || offering.service.vendor.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Offering not found.",
      });
    }

    const [rules, exceptions] = await prisma.$transaction([
      prisma.availabilityRule.findMany({
        where: {
          offeringId: offering.id,
        },
        orderBy: {
          weekday: "asc",
        },
      }),

      prisma.availabilityException.findMany({
        where: {
          offeringId: offering.id,
        },
        orderBy: {
          date: "asc",
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        offeringId: offering.id,
        rules: rules.map((rule) => ({
          ...rule,
          windows:
            typeof rule.windows === "string"
              ? JSON.parse(rule.windows)
              : rule.windows,
        })),
        exceptions: exceptions.map((exception) => ({
          ...exception,
          windows:
            typeof exception.windows === "string"
              ? JSON.parse(exception.windows)
              : exception.windows,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function saveVendorAvailability(req, res, next) {
  try {
    const payload = z.object({
      offeringId: z.string().min(1),
     rules: z.array(z.any()).default([]),
exceptions: z.array(z.any()).default([]),
    }).parse(req.body);

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

export async function addVendorAvailabilityException(req, res, next) {
  try {
    const payload = z.object({
      offeringId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(["CLOSED", "OPEN"]),
      windows: z.array(z.any()),
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

export async function deleteVendorAvailabilityException(req, res, next) {
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
    return res.json({ success: true, data: { message: "Exception deleted." } });
  } catch (error) {
    next(error);
  }
}
