import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { initiatePayment, retryPayment, paymentWebhook, getPaymentByBooking, getPayments } from "../controllers/payment.controller.js";

const router = Router();

router.post("/initiate", authenticate, initiatePayment);
router.post("/:id/retry", authenticate, retryPayment);
router.post("/webhook", paymentWebhook);
router.get("/booking/:bookingId", authenticate, getPaymentByBooking);
router.get("/", authenticate, requirePermission("payment.view"), getPayments);

export default router;
