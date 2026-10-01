import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validate.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema, passwordSetupSchema } from "../schema/auth.schema.js";
import { AuthMiddleware, type AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { permittedRole } from "../middlewares/role.middleware.js";
import { Role } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { ENV } from "../config/env.js";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

const passwordSettingsOrigin = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get("origin");
  if (origin && origin !== new URL(ENV.FRONTEND_URL).origin) {
    res.status(403).json({ status: "error", message: "This password request came from an untrusted site." });
    return;
  }
  next();
};

const passwordSettingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: req => (req as AuthenticatedRequest).user?.userId ?? "unauthenticated",
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many password requests. Please try again in 15 minutes." },
});

// ---- Rate Limiters ----

// Login: max 20 attempts per 15 min per IP — slows brute-force password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many login attempts. Please try again in 15 minutes." },
});

// Signup: max 10 new accounts per hour per IP — prevents mass fake account creation
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many accounts created from this IP. Please try again later." },
});

// Email links: max 10 requests per 15 min per IP — prevents inbox flooding
const emailLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests. Please wait 15 minutes before trying again." },
});

// Auth Endpoints
router.post("/signup", signupLimiter, validateSchema(signupSchema), authController.signup);
router.post("/login", loginLimiter, validateSchema(loginSchema), authController.login);
router.post("/refresh-token", authController.refresh);
router.post("/logout", authController.logout);

// Email Verification & Password Reset
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-email-verification", emailLinkLimiter, authController.resendEmailVerification);
router.post("/forgot-password", emailLinkLimiter, validateSchema(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validateSchema(resetPasswordSchema), authController.resetPassword);


// Google SSO
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

// Session Verification
router.get("/me", authMiddleware.execute, authController.me);
router.get("/socket-token", authMiddleware.execute, authController.socketToken);
router.patch("/me", authMiddleware.execute, validateSchema(updateProfileSchema), authController.updateProfile);
router.post("/change-password", authMiddleware.execute, passwordSettingsOrigin, passwordSettingsLimiter, validateSchema(changePasswordSchema), authController.changePassword);
router.post("/password-setup", authMiddleware.execute, passwordSettingsOrigin, passwordSettingsLimiter, validateSchema(passwordSetupSchema), authController.requestPasswordSetup);

router.get("/users", authMiddleware.execute, permittedRole([Role.admin]), authController.getAllUsers);
router.post("/users/:id/ban", authMiddleware.execute, permittedRole([Role.admin]), authController.banUser);
router.post("/users/:id/unban", authMiddleware.execute, permittedRole([Role.admin]), authController.unbanUser);

export default router;
