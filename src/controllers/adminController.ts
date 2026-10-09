import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { Contact } from "../models/Contact.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * Get all contact messages with filters
 * GET /api/admin/contacts
 */
export const getAdminContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { source, status } = req.query;

    const filter: any = {};
    if (source && source !== "all") filter.source = source;
    if (status && status !== "all") filter.status = status;

    const contacts = await Contact.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, {
      message: "Admin messages retrieved successfully",
      data: contacts,
      meta: { total: contacts.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get KPI Statistics overview for dashboard
 * GET /api/admin/stats
 */
export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const [totalMessages, unreadCount, contactFormCount, chatbotCount] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: "unread" }),
      Contact.countDocuments({ source: "contact_form" }),
      Contact.countDocuments({ source: "chatbot" }),
    ]);

    return sendSuccess(res, {
      message: "Dashboard KPI stats retrieved successfully",
      data: {
        stats: {
          totalMessages,
          unreadCount,
          contactFormCount,
          chatbotCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update message status (unread | read | archived)
 * PATCH /api/admin/contacts/:id
 */
export const updateContactStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "archived", "replied"].includes(status)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid status value provided.",
      });
    }

    const updated = await Contact.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return sendError(res, {
        statusCode: 404,
        message: "Message not found.",
      });
    }

    return sendSuccess(res, {
      message: "Message status updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message by ID
 * DELETE /api/admin/contacts/:id
 */
export const deleteAdminContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      return sendError(res, {
        statusCode: 404,
        message: "Message not found.",
      });
    }

    return sendSuccess(res, {
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
