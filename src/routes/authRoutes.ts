import { Router } from "express";
import { registerAdmin, loginAdmin, logoutAdmin, changePassword } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { authenticateAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", authLimiter, registerAdmin);

// POST /api/auth/login
router.post("/login", authLimiter, loginAdmin);

// POST /api/auth/logout
router.post("/logout", logoutAdmin);

// POST /api/auth/change-password
router.post("/change-password", authenticateAdmin, changePassword);

export default router;

