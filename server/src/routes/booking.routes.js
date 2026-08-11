import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getVendorBookings,
  vendorConfirmBooking,
  vendorRejectBooking,
  vendorCompleteBooking,
  vendorNoShowBooking,
} from "../controllers/booking.controller.js";

const router = Router();

router.post("/", authenticate, requirePermission("booking.create"), createBooking);
router.get("/my", authenticate, getMyBookings);
router.get("/:id", authenticate, getBookingById);
router.patch("/:id/cancel", authenticate, requirePermission("booking.cancel"), cancelBooking);
router.patch("/:id/reschedule", authenticate, requirePermission("booking.update"), rescheduleBooking);

router.get("/vendor/bookings", authenticate, requirePermission("booking.view"), getVendorBookings);
router.patch("/vendor/bookings/:id/confirm", authenticate, requirePermission("booking.update"), vendorConfirmBooking);
router.patch("/vendor/bookings/:id/reject", authenticate, requirePermission("booking.update"), vendorRejectBooking);
router.patch("/vendor/bookings/:id/complete", authenticate, requirePermission("booking.update"), vendorCompleteBooking);
router.patch("/vendor/bookings/:id/no-show", authenticate, requirePermission("booking.update"), vendorNoShowBooking);

export default router;
