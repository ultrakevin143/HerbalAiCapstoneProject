import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validate.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from "../schema/auth.schema.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

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
router.patch("/me", authMiddleware.execute, validateSchema(updateProfileSchema), authController.updateProfile);

// Get All Users (Admin only check inside controller)
router.get("/users", authMiddleware.execute, authController.getAllUsers);
router.post("/users/:id/ban", authMiddleware.execute, authController.banUser);
router.post("/users/:id/unban", authMiddleware.execute, authController.unbanUser);

export default router;
