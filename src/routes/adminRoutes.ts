import { Router } from "express";
import { authenticateAdmin } from "../middlewares/authMiddleware.js";
import {
  getAdminContacts,
  getAdminStats,
  updateContactStatus,
  deleteAdminContact,
} from "../controllers/adminController.js";

const router = Router();

// Protect all admin endpoints with JWT middleware
router.use(authenticateAdmin);

// GET /api/admin/contacts
router.get("/contacts", getAdminContacts);

// GET /api/admin/stats
router.get("/stats", getAdminStats);

// PATCH /api/admin/contacts/:id
router.patch("/contacts/:id", updateContactStatus);

// DELETE /api/admin/contacts/:id
router.delete("/contacts/:id", deleteAdminContact);

export default router;
