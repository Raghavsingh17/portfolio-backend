import dns from "node:dns";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

// Windows DNS fix for MongoDB Atlas replicaSet resolution on local ISPs
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore in environments where restricted
}

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn("⚠️ MONGODB_URI is not defined in .env. Database operations will be limited.");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    logger.success(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    logger.error(`MongoDB Connection Error: ${error.message}`);
    logger.warn("Server will continue running. Ensure MongoDB Atlas cluster is accessible.");
    return false;
  }
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  logger.success("MongoDB reconnected.");
});

export const getDBStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
});