import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 10_000,
  dnsTimeout: 8_000,
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

const gmailAuthorizationErrors = new Set([
  "invalid_grant", "invalid_client", "invalid_request", "invalid_scope",
  "unauthorized_client", "unsupported_grant_type", "access_denied",
]);

const readGmailAccessToken = async (response: Response): Promise<string> => {
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
  if (!response.ok) {
    const reason = data && "error" in data && typeof data.error === "string"
      && gmailAuthorizationErrors.has(data.error) ? `; ${data.error}` : "";
    throw new Error(`Gmail authorization failed (HTTP ${response.status}${reason}).`);
  }
  if (!data || !("access_token" in data) || typeof data.access_token !== "string"
    || !data.access_token.trim()) {
    throw new Error("Gmail authorization returned no access token.");
  }
  return data.access_token;
};

export const ensureMailReady = (recipient?: string) => {
  const deliveryMode = ENV.EMAIL_DELIVERY_MODE.toLowerCase();
  if (deliveryMode === "log") return;
  if (deliveryMode === "allowlist" && recipient && !ENV.EMAIL_ALLOWED_RECIPIENTS.includes(recipient.trim().toLowerCase())) return;
  if (ENV.EMAIL_PROVIDER === "resend" && ENV.RESEND_API_KEY && ENV.RESEND_FROM_EMAIL) return;
  if (ENV.EMAIL_PROVIDER === "gmail" && ENV.GMAIL_CLIENT_ID && ENV.GMAIL_CLIENT_SECRET && ENV.GMAIL_REFRESH_TOKEN && ENV.GMAIL_SENDER_EMAIL) return;
  if (ENV.EMAIL_PROVIDER === "smtp" && ENV.SMTP_USER && ENV.SMTP_PASSWORD && ENV.SMTP_FROM) return;
  throw new Error("Email delivery is not configured.");
};

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

  ensureMailReady(to);

  if (ENV.EMAIL_PROVIDER === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `"${ENV.APP_NAME}" <${ENV.RESEND_FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Email provider rejected the request (HTTP ${response.status}).`);
    }
    return response.json();
  }

  if (ENV.EMAIL_PROVIDER === "gmail") {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: ENV.GMAIL_CLIENT_ID,
        client_secret: ENV.GMAIL_CLIENT_SECRET,
        refresh_token: ENV.GMAIL_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const accessToken = await readGmailAccessToken(tokenResponse);

    const composer = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const composed = await composer.sendMail({
      from: `"${ENV.APP_NAME}" <${ENV.GMAIL_SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (!Buffer.isBuffer(composed.message)) {
      throw new Error("Gmail message could not be composed.");
    }

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: composed.message.toString("base64url") }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Gmail rejected the message (HTTP ${response.status}).`);
    }
    return response.json();
  }

  const mailOptions = {
    from: `"${ENV.APP_NAME}" <${ENV.SMTP_FROM}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};
