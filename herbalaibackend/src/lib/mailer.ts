import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailOptions) => {
  const normalizedRecipient = to.trim().toLowerCase();
  const deliveryMode = ENV.EMAIL_DELIVERY_MODE.toLowerCase();
  const recipientIsAllowed = ENV.EMAIL_ALLOWED_RECIPIENTS.includes(normalizedRecipient);

  if (deliveryMode === "log" || (deliveryMode === "allowlist" && !recipientIsAllowed)) {
    const maskedRecipient = normalizedRecipient.replace(/^[^@]+/, "***");
    console.info(JSON.stringify({
      event: "email_suppressed",
      mode: deliveryMode,
      recipient: maskedRecipient,
      subject,
    }));
    return { messageId: "suppressed-local-email", suppressed: true };
  }

  if (deliveryMode !== "live" && deliveryMode !== "allowlist") {
    throw new Error(`Unsupported EMAIL_DELIVERY_MODE: ${ENV.EMAIL_DELIVERY_MODE}`);
  }

  const mailOptions = {
    from: `"${ENV.APP_NAME}" <${ENV.SMTP_FROM}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};
