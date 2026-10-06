import { Request, Response, NextFunction } from "express";
import { Contact } from "../models/Contact.js";
import { getDBStatus } from "../config/db.js";
import { sendContactNotification, sendAutoReply } from "../services/emailService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

// In-memory fallback storage in case MongoDB is temporarily offline
const inMemoryContacts: any[] = [];

/**
 * Handle new contact form submission
 * POST /api/contact or POST /api/v1/contact
 */
export const submitContact = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, email, subject, message, source = "contact_form" } = req.body;
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || null) as string;
    const userAgent = req.headers["user-agent"] || null;

    if (!name || !email || !message) {
      return sendError(res, {
        statusCode: 400,
        message: "Name, email, and message are required fields.",
      });
    }

    let savedContact: any = null;
    const dbStatus = getDBStatus();

    const formattedSubject = subject || (source === "chatbot" ? "Chatbot Lead" : "New Inquiry from Portfolio");

    if (dbStatus.isConnected) {
      savedContact = await Contact.create({
        name: name.trim(),
        email: email.trim(),
        subject: formattedSubject.trim(),
        message: message.trim(),
        source,
        ipAddress,
        userAgent,
      });
    } else {
      // Temporary in-memory fallback
      savedContact = {
        _id: `mem_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        subject: formattedSubject.trim(),
        message: message.trim(),
        source,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      };
      inMemoryContacts.unshift(savedContact);
      logger.warn("Saved contact message to in-memory fallback (MongoDB not connected).");
    }

    // Fire email notifications asynchronously (non-blocking)
    Promise.allSettled([
      sendContactNotification({
        name,
        email,
        subject: savedContact.subject,
        message,
        source,
        contactId: savedContact._id,
      }),
      sendAutoReply({ name, email }),
    ]).catch((err: any) => {
      logger.error(`Error in async email dispatch: ${err.message}`);
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Thank you for reaching out! Your message has been received.",
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        source,
        createdAt: savedContact.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contact messages with pagination and status filter
 * GET /api/contact or GET /api/v1/contact
 */
export const getContacts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      return sendSuccess(res, {
        message: "Retrieved messages from local memory buffer",
        data: inMemoryContacts.slice((pageNum - 1) * limitNum, pageNum * limitNum),
        meta: {
          total: inMemoryContacts.length,
          page: pageNum,
          pages: Math.ceil(inMemoryContacts.length / limitNum) || 1,
        },
      });
    }

    const filter: any = {};
    if (status) filter.status = status;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      message: "Messages retrieved successfully",
      data: contacts,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a contact message
 * DELETE /api/contact/:id
 */
export const deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      const idx = inMemoryContacts.findIndex((c) => c._id === id);
      if (idx === -1) {
        return sendError(res, { statusCode: 404, message: "Message not found" });
      }
      inMemoryContacts.splice(idx, 1);
      return sendSuccess(res, { message: "Message deleted successfully from buffer" });
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, { statusCode: 404, message: "Message not found" });
    }

    return sendSuccess(res, { message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};