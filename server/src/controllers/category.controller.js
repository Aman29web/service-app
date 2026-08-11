import { z } from "zod";
import { prisma } from "../config/db.js";

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const payload = createCategorySchema.parse(req.body);
    const category = await prisma.category.create({ data: payload });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const id = req.params.id;
    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, data: { message: "Category deleted." } });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    next(error);
  }
}
