import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../utils/logger.js";

let transporter: Transporter | null = null;

export const initMailer = async (): Promise<boolean> => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    logger.info("Email credentials (EMAIL_USER / EMAIL_PASS) not set. FormSubmit AJAX fallback active.");
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user, pass },
    });

    await transporter.verify();
    logger.success("Email service transporter verified and ready.");
    return true;
  } catch (error: any) {
    logger.warn(`Email service verification warning: ${error.message}`);
    return false;
  }
};

export const getTransporter = (): Transporter | null => transporter;