import { Router } from "express";
import { getServices, getServiceById, createService, updateService, deleteService, updateServiceStatus } from "../controllers/service.controller.js";
import { getSlots, getNextAvailableSlot } from "../controllers/availability.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getServices);
router.get("/:serviceId/slots", getSlots);
router.get("/:serviceId/slots/next", getNextAvailableSlot);
router.get("/:id", getServiceById);
router.post("/", authenticate, requirePermission("service.create"), createService);
router.patch("/:id", authenticate, requirePermission("service.update"), updateService);
router.delete("/:id", authenticate, requirePermission("service.delete"), deleteService);
router.patch("/:id/status", authenticate, requirePermission("service.publish"), updateServiceStatus);

export default router;
