import { Router } from "express";
import { submitContact, getContacts, deleteContact } from "../controllers/contactController.js";
import { contactLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// POST /api/contact or POST /api/v1/contact (Main submission endpoint)
router.post("/", contactLimiter, submitContact);

// Admin / Inspection routes
router.get("/", getContacts);
router.delete("/:id", deleteContact);

export default router;