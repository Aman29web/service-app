import { z } from "zod";
import { prisma } from "../config/db.js";

const pageQuerySchema = z.object({
  page: z.string().optional(),
  status: z.string().optional(),
});

const updateVendorStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reason: z.string().optional(),
});

const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

function formatBooking(booking) {
  return {
    ...booking,
    amount: Math.round(booking.amount / 100),
    price: Math.round(booking.amount / 100),
    currency: booking.offering?.currency || "INR",
  };
}

function formatPayment(payment) {
  return {
    ...payment,
    amount: Math.round(payment.amount / 100),
  };
}

export async function getAdminDashboard(req, res, next) {
  try {
    const [vendorCount, pendingVendors, bookingCount, paymentStats, failedPayments] = await Promise.all([
      prisma.vendorProfile.count(),
      prisma.vendorProfile.count({ where: { status: "PENDING" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: "FAILED" } }),
    ]);

    return res.json({
      success: true,
      data: {
        vendors: vendorCount,
        pendingVendors,
        bookings: bookingCount,
        revenue: Math.round((paymentStats._sum.amount || 0) / 100),
        failedPayments,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingVendors(req, res, next) {
  try {
    const query = pageQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = query.status ? { status: query.status } : {};

    const [vendors, total] = await prisma.$transaction([
      prisma.vendorProfile.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorProfile.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        vendors,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVendorStatus(req, res, next) {
  try {
    const payload = updateVendorStatusSchema.parse(req.body);
    const id = req.params.id;

    const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    const updated = await prisma.vendorProfile.update({
      where: { id },
      data: {
        status: payload.status,
        rejectionReason: payload.status === "REJECTED" ? payload.reason : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `Vendor status updated to ${payload.status}`,
        targetType: "VendorProfile",
        targetId: id,
        reason: payload.reason,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function getAdminBookings(req, res, next) {
  try {
    const query = pageQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = query.status ? { status: query.status } : {};

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          customer: true,
          vendor: true,
          offering: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        bookings: bookings.map(formatBooking),
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPayments(req, res, next) {
  try {
    const query = pageQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const where = query.status ? { status: query.status } : {};

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: { booking: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        payments: payments.map(formatPayment),
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoles(req, res, next) {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });

    return res.json({
      success: true,
      data: {
        roles: roles.map((role) => ({
          ...role,
          permissions: role.permissions.map((item) => item.permission),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRolePermissions(req, res, next) {
  try {
    const payload = updateRolePermissionsSchema.parse(req.body);
    const id = req.params.id;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: payload.permissions.map((permission) => ({
          roleId: id,
          permission,
        })),
      }),
    ]);

    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    return res.json({
      success: true,
      data: {
        ...updatedRole,
        permissions: updatedRole.permissions.map((item) => item.permission),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const query = pageQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = 20;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        include: { actor: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count(),
    ]);

    return res.json({
      success: true,
      data: {
        logs,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}
