import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getCustomerDashboard } from "../controllers/customer.controller.js";

const router = Router();

router.get("/dashboard", authenticate, getCustomerDashboard);

export default router;
