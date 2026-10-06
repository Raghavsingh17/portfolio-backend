import { Response } from "express";

interface SuccessOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: any;
}

interface ErrorOptions {
  statusCode?: number;
  message?: string;
  errors?: any;
}

export const sendSuccess = <T>(res: Response, options: SuccessOptions<T> = {}): Response => {
  const { statusCode = 200, message = "Success", data = null, meta = null } = options;
  const body: Record<string, any> = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(body);
};

export const sendError = (res: Response, options: ErrorOptions = {}): Response => {
  const { statusCode = 500, message = "Internal Server Error", errors = null } = options;
  const body: Record<string, any> = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };
  return res.status(statusCode).json(body);
};