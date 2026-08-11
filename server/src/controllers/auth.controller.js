import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const registerCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const registerVendorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function registerCustomer(req, res, next) {
  try {
    const payload = registerCustomerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const role = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        roleId: role.id,
      },
      include: { role: { include: { permissions: true } } },
    });

    return res.status(201).json({ success: true, data: { message: "Customer account created." } });
  } catch (error) {
    next(error);
  }
}

export async function registerVendor(req, res, next) {
  try {
    const payload = registerVendorSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const role = await prisma.role.findUnique({ where: { name: "VENDOR" } });

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        roleId: role.id,
        vendorProfile: {
          create: {
            businessName: payload.businessName,
            phone: payload.phone,
            address: payload.address,
            description: "",
          },
        },
      },
      include: { role: { include: { permissions: true } }, vendorProfile: true },
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "Vendor application submitted successfully. Your account is pending approval.",
      },
    });
  } catch (error) {
    next(error);
  }
}

function getUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map((item) => item.permission),
    vendorProfile: user.vendorProfile || null,
  };
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { role: { include: { permissions: true } }, vendorProfile: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: getUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const cookieToken = req.cookies?.refreshToken;
    const bodyToken = req.body?.token;
    const token = cookieToken || bodyToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token required." });
    }

    const existing = await prisma.refreshToken.findUnique({ where: { token } });

    if (!existing || existing.revoked || existing.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Invalid refresh token." });
    }

    const payload = await prisma.user.findUnique({
      where: { id: existing.userId },
      include: { role: { include: { permissions: true } }, vendorProfile: true },
    });

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid refresh token." });
    }

    const accessToken = signAccessToken({ userId: payload.id });
    const newRefreshToken = signRefreshToken({ userId: payload.id });

    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });

    await prisma.refreshToken.create({
      data: {
        userId: payload.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.token;

    if (token) {
      await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
    }

    res.json({ success: true, data: { message: "Logged out." } });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: { include: { permissions: true } }, vendorProfile: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, data: { user: getUserResponse(user) } });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = signRefreshToken({ userId: user.id });
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      console.log(`Password reset token for ${email}: ${token}`);
    }

    return res.json({
      success: true,
      data: { message: "If an account exists, a password reset token has been generated." },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: payload.token } });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.refreshToken.update({ where: { token: payload.token }, data: { revoked: true } });

    return res.json({ success: true, data: { message: "Password reset successful." } });
  } catch (error) {
    next(error);
  }
}
