import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  getVendorDashboard,
  getVendorProfile,
  updateVendorProfile,
  getVendorServices,
  getVendorServiceById,
  getVendorBookings,
  vendorConfirmBooking,
  vendorRejectBooking,
  vendorCompleteBooking,
  vendorNoShowBooking,
  getVendorAvailability,
  saveVendorAvailability,
  addVendorAvailabilityException,
  deleteVendorAvailabilityException,
} from "../controllers/vendor.controller.js";

const router = Router();

router.get("/dashboard", authenticate, getVendorDashboard);
router.get("/profile", authenticate, getVendorProfile);
router.patch("/profile", authenticate, updateVendorProfile);

router.get("/services", authenticate, getVendorServices);
router.get("/services/:id", authenticate, getVendorServiceById);

router.get("/bookings", authenticate, getVendorBookings);
router.patch("/bookings/:id/confirm", authenticate, vendorConfirmBooking);
router.patch("/bookings/:id/reject", authenticate, vendorRejectBooking);
router.patch("/bookings/:id/complete", authenticate, vendorCompleteBooking);
router.patch("/bookings/:id/no-show", authenticate, vendorNoShowBooking);

router.get("/availability", authenticate, getVendorAvailability);
router.put("/availability", authenticate, saveVendorAvailability);
router.post("/availability/exceptions", authenticate, addVendorAvailabilityException);
router.delete("/availability/exceptions/:id", authenticate, deleteVendorAvailabilityException);

export default router;
