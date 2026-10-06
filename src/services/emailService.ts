import { getTransporter } from "../config/mailer.js";
import { logger } from "../utils/logger.js";

interface ContactNotificationParams {
  name: string;
  email: string;
  subject?: string;
  message: string;
  contactId?: any;
  source?: string;
}

export const sendContactNotification = async ({
  name,
  email,
  subject,
  message,
  contactId,
  source = "contact_form",
}: ContactNotificationParams): Promise<{ success: boolean; provider?: string; messageId?: string; simulated?: boolean; error?: string }> => {
  const transporter = getTransporter();
  const receiver = process.env.EMAIL_RECEIVER || "raghavsingh7631@gmail.com";
  const sender = process.env.EMAIL_USER;

  // 1. If Nodemailer transporter is configured with credentials, use it
  if (transporter && sender) {
    try {
      const mailOptions = {
        from: `"Portfolio Contact Form" <${sender}>`,
        to: receiver,
        replyTo: email,
        subject: `📬 Portfolio Message: ${subject || "New Inquiry"} from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 24px; border-radius: 12px;">
            <h2 style="color: #38bdf8;">New Portfolio Message Received!</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
            <p><strong>Subject:</strong> ${subject || "N/A"}</p>
            <p><strong>Source:</strong> ${source}</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-top: 12px;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Message ID: ${contactId || "N/A"}</p>
          </div>
        `,
      };
      const info = await transporter.sendMail(mailOptions);
      logger.success(`Contact notification email sent via Nodemailer: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      logger.warn(`Nodemailer failed (${err.message}). Trying FormSubmit fallback...`);
    }
  }

  // 2. Direct fallback via FormSubmit AJAX service
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${receiver}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        subject: subject || `New ${source} from ${name}`,
        message,
        source,
        _subject: `Portfolio [${source}]: ${name} (${email})`,
        _replyto: email,
        _template: "table",
      }),
    });

    const data: any = await response.json().catch(() => ({}));
    if (response.ok && data.success !== "false") {
      logger.success(`Contact notification email delivered via FormSubmit to ${receiver}`);
      return { success: true, provider: "formsubmit" };
    }
  } catch (err: any) {
    logger.warn(`FormSubmit email notice: ${err.message}`);
  }

  logger.info(`Simulated contact email for ${name} (${email})`);
  return { success: true, simulated: true };
};

export const sendAutoReply = async ({ name, email }: { name: string; email: string }): Promise<{ success: boolean; error?: string; simulated?: boolean }> => {
  const transporter = getTransporter();
  const sender = process.env.EMAIL_USER;

  if (!transporter || !sender) return { success: true, simulated: true };

  try {
    await transporter.sendMail({
      from: `"Raghav Singh" <${sender}>`,
      to: email,
      subject: "Thank you for getting in touch! 🤝",
      html: `
        <div style="font-family: Arial, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 24px;">
          <h2>Hi ${name},</h2>
          <p>Thank you for reaching out through my portfolio website! I have received your message and will review it shortly.</p>
          <p>Best regards,<br><strong>Raghav Singh</strong><br>Full-Stack Developer & UI Engineer</p>
        </div>
      `,
    });
    logger.info(`Auto-reply sent to ${email}`);
    return { success: true };
  } catch (err: any) {
    logger.warn(`Could not send auto-reply to ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
};