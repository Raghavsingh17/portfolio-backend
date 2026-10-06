import { Request, Response, NextFunction } from "express";
import { generateChatReply } from "../services/aiChatService.js";

/**
 * Handle AI Assistant chat interaction
 * POST /api/chat or POST /api/v1/chat/message
 */
export const handleChatMessage = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await generateChatReply({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    return res.status(200).json({
      success: true,
      response: result.reply,
      reply: result.reply,
      data: {
        reply: result.reply,
        response: result.reply,
        source: result.source,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};