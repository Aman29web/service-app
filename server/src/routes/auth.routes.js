import { Router } from "express";
import { login, registerCustomer, registerVendor, refreshToken, logout, me, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register/customer", registerCustomer);
router.post("/register/vendor", registerVendor);
router.post("/customer/signup", registerCustomer);
router.post("/vendor/signup", registerVendor);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
