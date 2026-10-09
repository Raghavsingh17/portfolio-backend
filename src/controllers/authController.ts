import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

// Helper for Password Strength Validation
const isStrongPassword = (password: string): boolean => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// Helper for Setting Auth Cookie
const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Register Admin
 * POST /api/auth/register
 */
export const registerAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (!name || !email || !password || !adminSecret) {
      return sendError(res, {
        statusCode: 400,
        message: "Name, email, password, and adminSecret are required fields.",
      });
    }

    // Strong Password Validation
    if (!isStrongPassword(password)) {
      return sendError(res, {
        statusCode: 400,
        message: "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).",
      });
    }

    const validSecret = process.env.ADMIN_SECRET || "RaghavAdminSecret2026!";
    if (adminSecret !== validSecret) {
      return sendError(res, {
        statusCode: 403,
        message: "Invalid Admin Registration Secret Key.",
      });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return sendError(res, {
        statusCode: 400,
        message: "An admin account with this email address already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "fallback_jwt_secret",
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);
    logger.info("New Admin registered successfully");

    return sendSuccess(res, {
      statusCode: 201,
      message: "Admin account created successfully!",
      data: {
        token,
        user: { name: admin.name, email: admin.email, role: admin.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Admin with Account Lockout & Audit Logging
 * POST /api/auth/login
 */
export const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email, password } = req.body;
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1") as string;

    if (!email || !password) {
      return sendError(res, {
        statusCode: 400,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid email or password credentials.",
      });
    }

    // Check Account Lockout
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutesRemaining = Math.ceil((admin.lockUntil.getTime() - Date.now()) / (1000 * 60));
      return sendError(res, {
        statusCode: 429,
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesRemaining} minutes.`,
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Increment failed attempts
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;

      // Lock for 15 mins after 5 failed attempts
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        logger.warn(`Account locked for IP: ${ipAddress}`);
      }

      await admin.save();

      return sendError(res, {
        statusCode: 401,
        message: admin.failedLoginAttempts >= 5
          ? "Account has been locked for 15 minutes due to 5 failed attempts."
          : `Invalid email or password. Attempt ${admin.failedLoginAttempts}/5.`,
      });
    }

    // Reset failed attempts & update audit logs on successful login
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLoginAt = new Date();
    admin.lastLoginIP = ipAddress;
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "fallback_jwt_secret",
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);

    return sendSuccess(res, {
      message: "Login successful!",
      data: {
        token,
        user: { name: admin.name, email: admin.email, role: admin.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Admin
 * POST /api/auth/logout
 */
export const logoutAdmin = async (req: Request, res: Response): Promise<any> => {
  res.clearCookie("admin_token");
  return sendSuccess(res, { message: "Logged out successfully" });
};

/**
 * Change Admin Password
 * POST /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user?.id;

    if (!currentPassword || !newPassword) {
      return sendError(res, {
        statusCode: 400,
        message: "Current password and new password are required.",
      });
    }

    if (!isStrongPassword(newPassword)) {
      return sendError(res, {
        statusCode: 400,
        message: "New password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendError(res, { statusCode: 404, message: "Admin user not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return sendError(res, { statusCode: 401, message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return sendSuccess(res, { message: "Password updated successfully!" });
  } catch (error) {
    next(error);
  }
};

