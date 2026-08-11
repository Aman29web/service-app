import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  getAdminDashboard,
  getPendingVendors,
  updateVendorStatus,
  getAdminBookings,
  getAdminPayments,
  getRoles,
  updateRolePermissions,
  getAuditLogs,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/dashboard", authenticate, requirePermission("admin.dashboard"), getAdminDashboard);
router.get("/vendors", authenticate, requirePermission("vendor.view"), getPendingVendors);
router.patch("/vendors/:id/status", authenticate, requirePermission("vendor.approve"), updateVendorStatus);
router.get("/bookings", authenticate, requirePermission("booking.view"), getAdminBookings);
router.get("/payments", authenticate, requirePermission("payment.view"), getAdminPayments);
router.get("/roles", authenticate, requirePermission("role.view"), getRoles);
router.patch("/roles/:id", authenticate, requirePermission("role.update"), updateRolePermissions);
router.get("/audit-logs", authenticate, requirePermission("audit.view"), getAuditLogs);

export default router;
