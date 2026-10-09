import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction): any => {
  let token: string | undefined;

  // 1. Check HTTP-Only Cookie first (Most Secure)
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }
  // 2. Fallback to Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, {
      statusCode: 401,
      message: "Unauthorized. No security token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_jwt_secret") as {
      id: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    return sendError(res, {
      statusCode: 401,
      message: "Unauthorized. Security token has expired or is invalid.",
    });
  }
};

