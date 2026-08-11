import { z } from "zod";
import { prisma } from "../config/db.js";

const initiatePaymentSchema = z.object({
  bookingId: z.string().min(1),
});

const retryPaymentSchema = z.object({
  paymentId: z.string().min(1),
});

const webhookSchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED", "REFUNDED"]),
  providerReference: z.string().optional(),
});

const pageQuerySchema = z.object({
  page: z.string().optional(),
  status: z.string().optional(),
});

function normalizePayment(payment) {
  return {
    ...payment,
    amount: Math.round(payment.amount / 100),
  };
}

export async function initiatePayment(req, res, next) {
  try {
    const payload = initiatePaymentSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.payment) {
      return res.json({ success: true, data: normalizePayment(booking.payment) });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: payload.bookingId,
        amount: booking.amount,
        mode: booking.paymentMode,
        status: "INITIATED",
        providerReference: `PAYMENT-${payload.bookingId}`,
      },
    });

    return res.status(201).json({ success: true, data: normalizePayment(payment) });
  } catch (error) {
    next(error);
  }
}

export async function retryPayment(req, res, next) {
  try {
    const payload = retryPaymentSchema.parse({ paymentId: req.params.id });
    const payment = await prisma.payment.findUnique({ where: { id: payload.paymentId } });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    const updated = await prisma.payment.update({
      where: { id: payload.paymentId },
      data: { status: "INITIATED" },
    });

    return res.json({ success: true, data: normalizePayment(updated) });
  } catch (error) {
    next(error);
  }
}

export async function paymentWebhook(req, res, next) {
  try {
    const payload = webhookSchema.parse(req.body);
    const payment = await prisma.payment.findUnique({
      where: { id: payload.paymentId },
      include: { booking: true },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    const data = {
      status: payload.status,
      providerReference: payload.providerReference ?? payment.providerReference,
    };

    const updatedPayment = await prisma.payment.update({
      where: { id: payload.paymentId },
      data,
    });

    if (payload.status === "SUCCESS" && payment.booking && payment.booking.paymentMode === "PAY_NOW") {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "CONFIRMED",
          history: {
            create: {
              status: "CONFIRMED",
              note: "Payment completed via webhook.",
            },
          },
        },
      });
    }

    return res.json({ success: true, data: normalizePayment(updatedPayment) });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByBooking(req, res, next) {
  try {
    const bookingId = req.params.bookingId;
    const payment = await prisma.payment.findUnique({ where: { bookingId } });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    return res.json({ success: true, data: normalizePayment(payment) });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req, res, next) {
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
        payments: payments.map(normalizePayment),
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}
