import { z } from "zod";
import { prisma } from "../config/db.js";

const createServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]).optional().default("DRAFT"),
  offerings: z.array(
    z.object({
      name: z.string().min(1),
      durationMinutes: z.number().int().positive(),
      price: z.number().nonnegative(),
      currency: z.string().min(1).optional().default("INR"),
    })
  ),
});

const updateServiceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]).optional(),
  offerings: z.array(
    z.object({
      name: z.string().min(1),
      durationMinutes: z.number().int().positive(),
      price: z.number().nonnegative(),
      currency: z.string().min(1).optional().default("INR"),
    })
  ).optional(),
});

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]),
});

function toPublicOffering(offering) {
  return {
    ...offering,
    price: Math.round(offering.price / 100),
  };
}

function toPublicService(service) {
  return {
    ...service,
    offerings: (service.offerings || []).map(toPublicOffering),
  };
}

export async function getServices(req, res, next) {
  try {
    const query = z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      category: z.string().optional(),
    }).parse(req.query);

    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 12), 1), 100);

    const where = {
      status: "PUBLISHED",
      vendor: { status: "APPROVED" },
      ...(query.category ? { categoryId: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [services, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        include: {
          category: true,
vendor: {
  select: {
    businessName: true,
    user: {
      select: {
        name: true,
      },
    },
  },
},
          offerings: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        services: services.map(toPublicService),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getServiceById(req, res, next) {
  try {
    const id = req.params.id;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,vendor: {
  select: {
    businessName: true,
    status: true,
    user: {
      select: {
        name: true,
      },
    },
  },
},  vendor: { select: { businessName: true, name: true, status: true } },
        offerings: true,
      },
    });

    if (!service || service.status !== "PUBLISHED" || service.vendor.status !== "APPROVED") {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.json({ success: true, data: toPublicService(service) });
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const payload = createServiceSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendorProfile: true },
    });

    if (!user?.vendorProfile) {
      return res.status(403).json({ success: false, message: "Only vendors can create services." });
    }

    if (payload.status === "PUBLISHED" && user.vendorProfile.status !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Vendor must be approved before publishing services." });
    }

    const service = await prisma.service.create({
      data: {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        vendorId: user.vendorProfile.id,
        status: payload.status,
        offerings: {
          create: payload.offerings.map((item) => ({
            name: item.name,
            durationMinutes: item.durationMinutes,
            price: Math.round(item.price * 100),
            currency: item.currency,
          })),
        },
      },
      include: { offerings: true },
    });

    return res.status(201).json({ success: true, data: toPublicService(service) });
  } catch (error) {
    next(error);
  }
}

export async function updateService(req, res, next) {
  try {
    const payload = updateServiceSchema.parse(req.body);
    const id = req.params.id;
    const userId = req.user.id;

    const service = await prisma.service.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!service || service.vendor.userId !== userId) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    if (payload.status === "PUBLISHED" && service.vendor.status !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Vendor must be approved before publishing services." });
    }

    await prisma.$transaction(async (tx) => {
      if (payload.offerings) {
        await tx.offering.deleteMany({ where: { serviceId: id } });
      }

      await tx.service.update({
        where: { id },
        data: {
          title: payload.title,
          description: payload.description,
          categoryId: payload.categoryId,
          status: payload.status,
          offerings: payload.offerings
            ? {
                create: payload.offerings.map((item) => ({
                  name: item.name,
                  durationMinutes: item.durationMinutes,
                  price: Math.round(item.price * 100),
                  currency: item.currency,
                })),
              }
            : undefined,
        },
      });
    });

    const updated = await prisma.service.findUnique({
      where: { id },
      include: { offerings: true },
    });

    return res.json({ success: true, data: toPublicService(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const service = await prisma.service.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!service || service.vendor.userId !== userId) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    await prisma.service.delete({ where: { id } });

    return res.json({ success: true, data: { message: "Service deleted." } });
  } catch (error) {
    next(error);
  }
}

export async function updateServiceStatus(req, res, next) {
  try {
    const payload = statusSchema.parse(req.body);
    const id = req.params.id;
    const userId = req.user.id;

    const service = await prisma.service.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!service || service.vendor.userId !== userId) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    if (payload.status === "PUBLISHED" && service.vendor.status !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Vendor must be approved before publishing services." });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { status: payload.status },
      include: { offerings: true },
    });

    return res.json({ success: true, data: toPublicService(updated) });
  } catch (error) {
    next(error);
  }
}
