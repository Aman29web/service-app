import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { getCategories, createCategory, deleteCategory } from "../controllers/category.controller.js";

const router = Router();

router.get("/", getCategories);
router.post("/", authenticate, requirePermission("category.create"), createCategory);
router.delete("/:id", authenticate, requirePermission("category.delete"), deleteCategory);

export default router;
