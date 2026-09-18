import { Router } from "express";
import { sendMessage, streamMessage } from "../controllers/chat.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.js";
import { chatRequestSchema } from "../schema/chat.schema.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const router = Router();
const authMiddleware = new AuthMiddleware();

// Chat rate limiter: max 30 queries per 10 minutes per authenticated user.
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const userId = (req as AuthenticatedRequest).user?.userId;
    return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
  },
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
router.post("/", authMiddleware.execute, chatLimiter, validateSchema(chatRequestSchema), sendMessage);
router.post("/stream", authMiddleware.execute, chatLimiter, validateSchema(chatRequestSchema), streamMessage);

export default router;
