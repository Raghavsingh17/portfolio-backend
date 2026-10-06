import { Router } from "express";
import { handleChatMessage } from "../controllers/chatController.js";
import { chatLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Endpoint for Raghav's AI Assistant chatbot
// POST /api/chat or POST /api/v1/chat or POST /api/v1/chat/message
router.post("/", chatLimiter, handleChatMessage);
router.post("/message", chatLimiter, handleChatMessage);

export default router;