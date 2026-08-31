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
  const mailOptions = {
    from: `"${ENV.APP_NAME}" <${ENV.SMTP_FROM}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};
