import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

   let payload;

try {
  payload = jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  console.error("JWT VERIFY ERROR:", error.name);
  console.error("JWT VERIFY MESSAGE:", error.message);
  console.error("JWT SECRET EXISTS:", !!process.env.JWT_SECRET);

  return res.status(401).json({
    success: false,
    message: "Invalid or expired token",
  });
}

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: { include: { permissions: true } },
        vendorProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map((item) => item.permission),
      vendorProfile: user.vendorProfile,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  };
}
