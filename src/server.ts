import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initMailer } from "./config/mailer.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Startup sequence
const startServer = async () => {
  logger.info("Starting Portfolio Backend Service (TypeScript)...");

  // Initialize DB and Mailer concurrently
  await Promise.all([connectDB(), initMailer()]);

  server.listen(PORT, () => {
    logger.success(`🚀 Server running in [${process.env.NODE_ENV || "development"}] mode`);
    logger.success(`🔗 Local URL: http://localhost:${PORT}`);
    logger.success(`📡 API Base:  http://localhost:${PORT}/api`);
    logger.success(`🩺 Health:    http://localhost:${PORT}/health`);
  });
};

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server...`);
  server.close(() => {
    logger.info("HTTP server closed. Exiting process.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Global Error Catchers
process.on("uncaughtException", (err: Error) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
  logger.error("UNHANDLED REJECTION! Shutting down...", err?.stack || err);
  server.close(() => {
    process.exit(1);
  });
});

startServer();