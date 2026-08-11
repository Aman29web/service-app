import { Router } from "express";
import { getSlots, getNextAvailableSlot, getAvailabilityRules, saveAvailabilityRules, addAvailabilityException, deleteAvailabilityException, getVendorAvailability } from "../controllers/availability.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/slots", getSlots);
router.get("/slots/next", getNextAvailableSlot);
router.get("/rules", authenticate, requirePermission("service.update"), getAvailabilityRules);
router.put("/rules", authenticate, requirePermission("service.update"), saveAvailabilityRules);
router.post("/vendor/availability/exceptions", authenticate, requirePermission("service.update"), addAvailabilityException);
router.delete("/vendor/availability/exceptions/:id", authenticate, requirePermission("service.update"), deleteAvailabilityException);
router.get("/", authenticate, getVendorAvailability);

export default router;
