import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/apiResponse.js";

export const notFoundHandler = (req: Request, res: Response): any => {
  return sendError(res, {
    statusCode: 404,
    message: `Resource not found: [${req.method}] ${req.originalUrl}`,
  });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): any => {
  logger.error(`Unhandled Error: ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return sendError(res, {
    statusCode,
    message,
    errors: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};