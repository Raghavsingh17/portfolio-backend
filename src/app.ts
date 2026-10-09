import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { sendSuccess } from "./utils/apiResponse.js";
import { getDBStatus } from "./config/db.js";

const app: Application = express();

app.use(helmet());

const rawClients = process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173";
const allowedOrigins = rawClients
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} not allowed by Access-Control-Allow-Origin.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use("/api", apiLimiter);

app.get("/", (req: Request, res: Response) => {
  return sendSuccess(res, {
    message: "Raghav Singh Portfolio Backend API is Running (Contact, AI Chatbot and Admin Dashboard)",
    data: {
      status: "online",
      endpoints: {
        contact: "POST /api/contact",
        chat: "POST /api/chat",
        health: "GET /health",
      },
    },
  });
});

app.get("/health", (req: Request, res: Response) => {
  const dbStatus = getDBStatus();
  return sendSuccess(res, {
    message: "Portfolio API is healthy and operational",
    data: {
      status: "online",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.isConnected,
        status: dbStatus.isConnected ? "connected" : "disconnected",
      },
    },
  });
});

app.use("/api/v1", apiRouter);
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

