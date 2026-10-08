import * as userRepo from "../repositories/user.repository.js";
import * as tokenRepo from "../repositories/token.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { banMessage, isAccountBanned } from '../lib/user-ban.js';
import { ENV } from "../config/env.js";
import crypto from "crypto";
import { ensureMailReady, sendMail } from "../lib/mailer.js";
import { notifySessionInvalidated } from "../lib/session-invalidation.js";

// ---- Security helper: prevent HTML injection in email templates ----
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");


const googleClient = new OAuth2Client(
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  ENV.GOOGLE_REDIRECT_URI
);

interface SignupData {
  username: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
}

export const signup = async (data: SignupData) => {
  const email = data.email.trim().toLowerCase();
  const username = data.username.trim().toLowerCase();
  const existingEmail = await userRepo.findUserByEmail(email);
  if (existingEmail) {
    throw {
      status: 409,
      message: ENV.REQUIRE_EMAIL_VERIFICATION
        ? "A user with this email already exists."
        : "An account with this email already exists. Try signing in.",
      verificationRequired: ENV.REQUIRE_EMAIL_VERIFICATION,
    };
  }

  const existingUsername = await userRepo.findUserByUsername(username);
  if (existingUsername) {
    throw { status: 409, message: "A user with this username already exists." };
  }

  if (ENV.REQUIRE_EMAIL_VERIFICATION) {
    try {
      ensureMailReady(email);
    } catch {
      throw { status: 503, message: "Email delivery is temporarily unavailable." };
    }
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await userRepo.createUser({
    username,
    email,
    password: hashedPassword,
    name: data.name,
    avatar: data.avatar || null,
    emailVerificationRequired: ENV.REQUIRE_EMAIL_VERIFICATION,
  });

  if (!ENV.REQUIRE_EMAIL_VERIFICATION) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      verificationRequired: false,
      verificationEmailSent: false,
      message: "Account created. You can sign in now.",
    };
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await tokenRepo.createToken({
    userId: user.id,
    type: "EMAIL_VERIFY",
    token: verificationToken,
    expiresAt,
  });

  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  let verificationEmailSent: boolean;
  try {
    const delivery = await sendMail({
      to: user.email,
      subject: `${ENV.APP_NAME} - Verify Your Email`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #1b4332; text-align: center;">Welcome to ${escapeHtml(ENV.APP_NAME)}</h2>
          <p>Hi <strong>${escapeHtml(user.name)}</strong>,</p>
          <p>Thank you for signing up! Please verify your email address to activate your account by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #40916c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #40916c;">${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
    verificationEmailSent = delivery?.suppressed !== true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    verificationEmailSent = false;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    verificationRequired: true,
    verificationEmailSent,
    message: verificationEmailSent
      ? "Account created. Please check your email to verify it."
      : "Account created, but the verification email could not be sent. Request a new verification link.",
  };
};

export const login = async (data: { identifier?: string; email?: string; password: string }) => {
  const user = await userRepo.findUserByLoginIdentifier(data.identifier ?? data.email ?? '');
  if (!user) {
    throw { status: 401, message: "Invalid email/username or password." };
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw { status: 401, message: "Invalid email/username or password." };
  }

  if (isAccountBanned(user)) throw { status: 403, message: banMessage(user) };

  if (ENV.REQUIRE_EMAIL_VERIFICATION && user.emailVerificationRequired && !user.emailVerified) {
    throw { status: 403, message: "Please verify your email before logging in." };
  }

  // The login query already returned the current account state. Reuse only its
  // safe session fields for the immediate /auth/me request instead of paying a
  // second remote database round trip. Ban/profile mutations still invalidate it.
  userRepo.primeCachedUser(user);

  const tokenPayload = { userId: user.id, role: user.role, sessionVersion: user.sessionVersion };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Clean up old/expired/revoked tokens
  await tokenRepo.cleanupTokens(user.id);

  // Store refresh token in database (valid for 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenRepo.createToken({
    userId: user.id,
    type: "REFRESH",
    token: refreshToken,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      joined: user.joined,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findActiveRefreshToken(token);
  const payload = verifyRefreshToken(token);
  if (!tokenRecord || !payload || payload.userId !== tokenRecord.userId ||
      (payload.sessionVersion ?? 0) !== tokenRecord.user.sessionVersion) {
    throw { status: 401, message: "Invalid or expired refresh token." };
  }

  const user = await userRepo.findUserById(tokenRecord.userId);
  if (!user || isAccountBanned(user)) {
    throw { status: 403, message: "Account banned or does not exist." };
  }

  // Generate new tokens
  const tokenPayload = { userId: tokenRecord.userId, role: tokenRecord.user.role, sessionVersion: tokenRecord.user.sessionVersion };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const rotated = await tokenRepo.rotateRefreshToken(tokenRecord.id, {
    userId: tokenRecord.userId,
    token: newRefreshToken,
    expiresAt,
  });
  if (!rotated) {
    throw { status: 401, message: "Invalid or expired refresh token." };
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (token: string) => {
  const tokenRecord = await tokenRepo.findActiveRefreshToken(token);
  if (tokenRecord) {
    await tokenRepo.revokeToken(tokenRecord.id);
  }
  return { message: "Logged out successfully." };
};

// --- Google SSO ---

export const getGoogleAuthUrl = (state: string): string => {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
};

export const googleLogin = async (code: string) => {
  // Exchange the authorization code for tokens
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) {
    throw { status: 400, message: "Google did not provide a sign-in token." };
  }

  // Verify the ID token and extract user info
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: ENV.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified !== true) {
    throw { status: 400, message: "Google did not provide a verified email address." };
  }

  const { email, name, picture } = payload;

  // Check if user already exists by email
  const foundUser = await userRepo.findUserByEmail(email);

  if (!foundUser) {
    // Auto-create an account for first-time Google users
    const emailLocalPart = email.split("@")[0] as string;
    const baseUsername = (name ?? emailLocalPart)
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const username = `${baseUsername}_${uniqueSuffix}`;

    // Generate a secure random password (they'll use Google to log in, not this)
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await hashPassword(randomPassword);

    await userRepo.createUser({
      username,
      email,
      password: hashedPassword,
      name: name ?? emailLocalPart,
      avatar: picture ?? null,
      emailVerified: new Date(),
    });

  }

  // Re-fetch user (consistent type whether new or existing)
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw { status: 500, message: "Failed to resolve user after Google login." };
  }

  if (isAccountBanned(user)) throw { status: 403, message: banMessage(user) };

  userRepo.primeCachedUser(user);

  // Issue JWT tokens (same flow as regular login)
  const tokenPayload = { userId: user.id, role: user.role, sessionVersion: user.sessionVersion };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Clean up old/expired/revoked tokens
  await tokenRepo.cleanupTokens(user.id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenRepo.createToken({
    userId: user.id,
    type: "REFRESH",
    token: refreshToken,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      joined: user.joined,
    },
    accessToken,
    refreshToken,
  };
};

export const verifyEmail = async (token: string) => {
  const tokenRecord = await tokenRepo.findActiveTokenByValue(token, "EMAIL_VERIFY");
  if (!tokenRecord) {
    throw { status: 400, message: "Invalid or expired verification token." };
  }

  const redeemed = await tokenRepo.redeemAccountToken({
    id: tokenRecord.id, userId: tokenRecord.userId, type: 'EMAIL_VERIFY',
  });
  if (!redeemed) throw { status: 400, message: "Invalid or expired verification token." };
  userRepo.invalidateCachedUser(tokenRecord.userId);

  return { message: "Email verified successfully. You can now log in." };
};

export const resendEmailVerification = async (email: string) => {
  if (!ENV.REQUIRE_EMAIL_VERIFICATION) {
    return { message: "Email verification is temporarily disabled. If you already have an account, sign in." };
  }

  const user = await userRepo.findUserByEmail(email);

  // Security: always return neutral response to prevent email enumeration
  if (!user || user.emailVerified) {
    return { message: "If this email is registered and unverified, a new link has been sent." };
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const replacement = await tokenRepo.createToken({
    userId: user.id,
    type: "EMAIL_VERIFY",
    token: verificationToken,
    expiresAt,
  });

  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  try {
    const delivery = await sendMail({
      to: user.email,
      subject: `${ENV.APP_NAME} - Verify Your Email`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1b4332; text-align: center;">Welcome to ${escapeHtml(ENV.APP_NAME)}</h2>
        <p>Hi <strong>${escapeHtml(user.name)}</strong>,</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #40916c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #40916c;">${verificationUrl}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
      `,
    });
    if (delivery?.suppressed) throw new Error("Verification email was suppressed.");
  } catch {
    console.error("Verification email delivery failed");
    try {
      await tokenRepo.revokeToken(replacement.id);
    } catch {
      console.error("Failed to clean up undelivered verification link");
    }
    throw { status: 503, code: "VERIFICATION_EMAIL_UNAVAILABLE" };
  }
  try {
    await tokenRepo.revokeOlderUserTokensByType(user.id, "EMAIL_VERIFY", replacement.id, replacement.createdAt);
  } catch {
    console.error("Failed to retire previous verification links");
  }
  return { message: "If this email is registered and unverified, a new link has been sent." };
};

export const forgotPassword = async (email: string) => {
  const user = await userRepo.findUserByEmail(email);

  const neutralResponse = {
    message: "If an account with that email exists, a password reset link has been sent. Check your email and Spam folder; if you requested one recently, wait an hour before trying again.",
  };

  if (!user || isAccountBanned(user)) {
    return neutralResponse;
  }

  const requestedAt = new Date();
  const cooldownStart = new Date(requestedAt.getTime() - 60 * 60 * 1000);
  const claimed = await userRepo.claimPasswordResetRequest(user.id, requestedAt, cooldownStart);
  if (!claimed) return neutralResponse;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(requestedAt.getTime() + 60 * 60 * 1000);

  let resetTokenRecord: Awaited<ReturnType<typeof tokenRepo.createToken>>;
  try {
    resetTokenRecord = await tokenRepo.createToken({
      userId: user.id,
      type: "PASSWORD_RESET",
      token: resetToken,
      expiresAt,
    });
  } catch (error) {
    await userRepo.releasePasswordResetRequest(user.id, requestedAt);
    throw error;
  }

  const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    const delivery = await sendMail({
      to: user.email,
      subject: `${ENV.APP_NAME} - Reset Your Password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #1b4332; text-align: center;">Set Your ${escapeHtml(ENV.APP_NAME)} Password</h2>
          <p>Hi <strong>${escapeHtml(user.name)}</strong>,</p>
          <p>We received a request to create or reset your ${escapeHtml(ENV.APP_NAME)} password. Click the button below to choose a password for this account:</p>
          <p>This does not change your Google password. If Google is linked to your account, you can still sign in with Google.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #40916c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Set ${escapeHtml(ENV.APP_NAME)} Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #40916c;">${resetUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link expires in 1 hour and can be used only once. Saving your password signs you out on all devices. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    if (delivery?.suppressed) throw new Error("Password reset email was suppressed.");
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    const cleanup = await Promise.allSettled([
      tokenRepo.revokeToken(resetTokenRecord.id),
      userRepo.releasePasswordResetRequest(user.id, requestedAt),
    ]);
    for (const result of cleanup) {
      if (result.status === "rejected") console.error("Failed to clean up password reset request:", result.reason);
    }
    return neutralResponse;
  }

  try {
    await tokenRepo.revokeOtherUserTokensByType(user.id, "PASSWORD_RESET", resetTokenRecord.id);
  } catch (error) {
    console.error("Failed to revoke previous password reset links:", error);
  }

  return neutralResponse;
};

export const changePassword = async (
  userId: string, sessionVersion: number, currentPassword: string, newPassword: string,
) => {
  const user = await userRepo.findPasswordCredentials(userId);
  if (!user || user.sessionVersion !== sessionVersion) {
    throw { status: 401, message: "Your session has expired. Please sign in again." };
  }
  if (isAccountBanned(user)) throw { status: 403, message: banMessage(user) };
  if (!await comparePassword(currentPassword, user.password)) {
    throw { status: 400, message: "Current password is incorrect." };
  }
  if (await comparePassword(newPassword, user.password)) {
    throw { status: 400, message: "Choose a password different from your current password." };
  }
  const passwordHash = await hashPassword(newPassword);
  if (!await userRepo.replacePassword(userId, user.password, sessionVersion, passwordHash)) {
    throw { status: 409, message: "Your account changed during this request. Please sign in again." };
  }
  userRepo.invalidateCachedUser(userId);
  notifySessionInvalidated(userId);
  return { message: "Password changed. Sign in again with your new password." };
};

export const requestPasswordSetup = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw { status: 401, message: "Please sign in again." };
  if (isAccountBanned(user)) throw { status: 403, message: banMessage(user) };
  return forgotPassword(user.email);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenRecord = await tokenRepo.findActiveTokenByValue(token, "PASSWORD_RESET");
  if (!tokenRecord) {
    throw { status: 400, message: "Invalid or expired password reset token." };
  }

  if (await comparePassword(newPassword, tokenRecord.user.password)) {
    throw { status: 400, message: "Choose a password different from your current password." };
  }

  const hashedPassword = await hashPassword(newPassword);

  const redeemed = await tokenRepo.redeemAccountToken({
    id: tokenRecord.id, userId: tokenRecord.userId,
    type: 'PASSWORD_RESET', passwordHash: hashedPassword,
  });
  if (!redeemed) throw { status: 400, message: "Invalid or expired password reset token." };
  userRepo.invalidateCachedUser(tokenRecord.userId);
  notifySessionInvalidated(tokenRecord.userId);

  return { message: "Password reset successful. You can now log in with your new password." };
};
