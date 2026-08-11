import { prisma } from "../config/db.js";

export async function getCustomerDashboard(req, res, next) {
  try {
    const customerId = req.user.id;

    const [totalBookings, pendingBookings, confirmedBookings, completedBookings] = await Promise.all([
      prisma.booking.count({ where: { customerId } }),
      prisma.booking.count({ where: { customerId, status: "PENDING" } }),
      prisma.booking.count({ where: { customerId, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { customerId, status: "COMPLETED" } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
      },
    });
  } catch (error) {
    next(error);
  }
}
