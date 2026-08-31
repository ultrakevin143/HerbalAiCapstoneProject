import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();
const authMiddleware = new AuthMiddleware();

// Chat rate limiter: max 30 queries per 10 minutes per IP/User to prevent quota exhaustion
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests to Dr. Ai. Please wait a few minutes before asking another question.",
  },
});

/**
 * POST /api/chat
 * Protected — requires a valid access token (logged-in contributors and above).
 * Per SRS FR-CHAT: "Member+" access only.
 */
router.post("/", authMiddleware.execute, chatLimiter, sendMessage);

export default router;
