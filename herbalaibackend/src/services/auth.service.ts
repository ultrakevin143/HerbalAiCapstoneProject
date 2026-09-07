import * as userRepo from "../repositories/user.repository.js";
import * as tokenRepo from "../repositories/token.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env.js";
import crypto from "crypto";
import { sendMail } from "../lib/mailer.js";

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
  `${ENV.BACKEND_URL}/api/auth/google/callback`
);

interface SignupData {
  username: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export const signup = async (data: SignupData) => {
  const existingEmail = await userRepo.findUserByEmail(data.email);
  if (existingEmail) {
    throw { status: 409, message: "A user with this email already exists." };
  }

  const existingUsername = await userRepo.findUserByUsername(data.username);
  if (existingUsername) {
    throw { status: 409, message: "A user with this username already exists." };
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await userRepo.createUser({
    username: data.username,
    email: data.email,
    password: hashedPassword,
    name: data.name,
    avatar: data.avatar || null,
    bio: data.bio || null,
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await tokenRepo.createToken({
    userId: user.id,
    type: "EMAIL_VERIFY",
    token: verificationToken,
    expiresAt,
  });

  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  try {
    await sendMail({
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
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    message: "Signup successful. Please check your email to verify your account.",
  };
};

export const login = async (data: { email: string; password: string }) => {
  const user = await userRepo.findUserByEmail(data.email);
  if (!user) {
    throw { status: 401, message: "Invalid email or password." };
  }

  if (user.isBanned) {
    throw { status: 403, message: "Your account has been banned. Please contact support." };
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw { status: 401, message: "Invalid email or password." };
  }

  if (!user.emailVerified) {
    throw { status: 403, message: "Please verify your email before logging in." };
  }


  const tokenPayload = { userId: user.id, role: user.role };
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
      bio: user.bio,
      joined: user.joined,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findActiveRefreshToken(token);
  if (!tokenRecord) {
    throw { status: 401, message: "Invalid or expired refresh token." };
  }

  const user = await userRepo.findUserById(tokenRecord.userId);
  if (!user || user.isBanned) {
    throw { status: 403, message: "Account banned or does not exist." };
  }

  // Revoke the old refresh token (Token Rotation)
  await tokenRepo.revokeToken(tokenRecord.id);

  // Generate new tokens
  const tokenPayload = { userId: tokenRecord.userId, role: tokenRecord.user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Store the new refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenRepo.createToken({
    userId: tokenRecord.userId,
    type: "REFRESH",
    token: newRefreshToken,
    expiresAt,
  });

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

export const getGoogleAuthUrl = (): string => {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
};

export const googleLogin = async (code: string) => {
  // Exchange the authorization code for tokens
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  // Verify the ID token and extract user info
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: ENV.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw { status: 400, message: "Failed to retrieve user info from Google." };
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
      bio: null,
      emailVerified: new Date(),
    });

  }

  // Re-fetch user (consistent type whether new or existing)
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw { status: 500, message: "Failed to resolve user after Google login." };
  }

  if (user.isBanned) {
    throw { status: 403, message: "Your account has been banned. Please contact support." };
  }

  // Issue JWT tokens (same flow as regular login)
  const tokenPayload = { userId: user.id, role: user.role };
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
      bio: user.bio,
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
  const user = await userRepo.findUserByEmail(email);

  // Security: always return neutral response to prevent email enumeration
  if (!user || user.emailVerified) {
    return { message: "If this email is registered and unverified, a new link has been sent." };
  }

  // Revoke all previous pending EMAIL_VERIFY tokens to prevent token accumulation
  await tokenRepo.revokeAllUserTokensByType(user.id, "EMAIL_VERIFY");

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await tokenRepo.createToken({
    userId: user.id,
    type: "EMAIL_VERIFY",
    token: verificationToken,
    expiresAt,
  });

  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await sendMail({
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

  return { message: "If this email is registered and unverified, a new link has been sent." };
};

export const forgotPassword = async (email: string) => {
  const user = await userRepo.findUserByEmail(email);

  // Security: always return neutral response to prevent email enumeration
  const neutralResponse = { message: "If an account with that email exists, a password reset link has been sent." };

  if (!user) {
    return neutralResponse;
  }

  // Revoke all previous pending PASSWORD_RESET tokens to prevent token accumulation
  await tokenRepo.revokeAllUserTokensByType(user.id, "PASSWORD_RESET");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  await tokenRepo.createToken({
    userId: user.id,
    type: "PASSWORD_RESET",
    token: resetToken,
    expiresAt,
  });

  const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await sendMail({
      to: user.email,
      subject: `${ENV.APP_NAME} - Reset Your Password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #1b4332; text-align: center;">Password Reset Request</h2>
          <p>Hi <strong>${escapeHtml(user.name)}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #40916c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #40916c;">${resetUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return neutralResponse;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenRecord = await tokenRepo.findActiveTokenByValue(token, "PASSWORD_RESET");
  if (!tokenRecord) {
    throw { status: 400, message: "Invalid or expired password reset token." };
  }

  const hashedPassword = await hashPassword(newPassword);

  const redeemed = await tokenRepo.redeemAccountToken({
    id: tokenRecord.id, userId: tokenRecord.userId,
    type: 'PASSWORD_RESET', passwordHash: hashedPassword,
  });
  if (!redeemed) throw { status: 400, message: "Invalid or expired password reset token." };
  userRepo.invalidateCachedUser(tokenRecord.userId);

  return { message: "Password reset successful. You can now log in with your new password." };
};

