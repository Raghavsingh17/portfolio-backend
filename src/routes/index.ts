import { Router } from "express";
import contactRoutes from "./contactRoutes.js";
import chatRoutes from "./chatRoutes.js";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import { sendSuccess } from "../utils/apiResponse.js";

const apiRouter = Router();

apiRouter.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "Raghav Singh's Portfolio Backend API (Contact, Chatbot & Admin Dashboard)",
    data: {
      version: "1.0.0",
      author: "Raghav Singh",
      endpoints: {
        contact: {
          submit: "POST /api/contact",
          list: "GET /api/contact",
          delete: "DELETE /api/contact/:id",
        },
        chat: {
          message: "POST /api/chat",
        },
        auth: {
          login: "POST /api/auth/login",
          register: "POST /api/auth/register",
        },
        admin: {
          contacts: "GET /api/admin/contacts",
          stats: "GET /api/admin/stats",
          updateStatus: "PATCH /api/admin/contacts/:id",
          deleteContact: "DELETE /api/admin/contacts/:id",
        },
      },
    },
  });
});

apiRouter.use("/contact", contactRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin", adminRoutes);

export default apiRouter;
