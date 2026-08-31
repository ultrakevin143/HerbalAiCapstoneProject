import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  getUsers,
  getConversations,
  getHistory,
  sendMessage,
  editMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = Router();
const authMiddleware = new AuthMiddleware();

// All messaging routes require authentication
router.use(authMiddleware.execute);

/**
 * GET /api/messages/users
 * List all users that the current user can message.
 */
router.get("/users", getUsers);

/**
 * GET /api/messages/conversations
 * Get the sidebar list of active conversations.
 */
router.get("/conversations", getConversations);

/**
 * GET /api/messages/history/:userId
 * Get the full message history between me and a specific user.
 */
router.get("/history/:userId", getHistory);

/**
 * POST /api/messages
 * Send a new direct message. Body: form-data with optional image file and receiverId, content.
 */
router.post("/", uploadImage, sendMessage);

/**
 * PUT /api/messages/:messageId
 * Edit an existing message's text content.
 */
router.put("/:messageId", editMessage);

/**
 * DELETE /api/messages/:messageId
 * Soft delete an existing message.
 */
router.delete("/:messageId", deleteMessage);

export default router;
