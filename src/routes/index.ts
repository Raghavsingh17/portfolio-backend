import { Router } from "express";
import contactRoutes from "./contactRoutes.js";
import chatRoutes from "./chatRoutes.js";
import { sendSuccess } from "../utils/apiResponse.js";

const apiRouter = Router();

// Base API info
apiRouter.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "Raghav Singh's Portfolio Backend API (Contact & Chatbot)",
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
      },
    },
  });
});

// Modular sub-routes
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/chat", chatRoutes);

export default apiRouter;