import type { Request, Response, NextFunction } from "express";
import * as messageRepo from "../repositories/message.repository.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { parseMessageCursor } from "../utils/message-cursor.js";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

const MAX_MESSAGE_LENGTH = 2000;

const parseMessageId = (value: unknown): number | null => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : null;
};

/**
 * GET /api/messages/users
 * Returns all messageable users (non-banned, excluding self).
 * Requires: authenticated user
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const currentUserId = authReq.user?.userId;

    if (!currentUserId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    const targetUserId = typeof req.query["id"] === "string" ? req.query["id"] : undefined;
    if (targetUserId) {
      const selectedUser = await messageRepo.getMessageableUserById(currentUserId, targetUserId);
      res.status(200).json({ status: "success", data: { users: selectedUser ? [selectedUser] : [], hasMore: false } });
      return;
    }
    const search = typeof req.query["search"] === "string" ? req.query["search"].trim().slice(0, 100) : "";
    const requestedLimit = Number(req.query["limit"]);
    const requestedOffset = Number(req.query["offset"]);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 20;
    const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, 100_000) : 0;
    const rows = await messageRepo.getMessageableUsers(currentUserId, search, limit, offset);
    res.status(200).json({ status: "success", data: { users: rows.slice(0, limit), hasMore: rows.length > limit } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/conversations
 * Returns the active conversations list for the logged-in user.
 * Requires: authenticated user
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const currentUserId = authReq.user?.userId;

    if (!currentUserId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    const requestedLimit = Number(req.query["limit"]);
    const requestedOffset = Number(req.query["offset"]);
    const search = typeof req.query["search"] === "string" ? req.query["search"].trim().slice(0, 100) : "";
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 25;
    const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, 100_000) : 0;
    const page = await messageRepo.getActiveConversations(currentUserId, search, limit, offset);
    res.status(200).json({ status: "success", data: page });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/history/:userId
 * Returns the full message history between the current user and the target user.
 * Requires: authenticated user
 */
export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const currentUserId = authReq.user?.userId;
    const targetUserId = req.params["userId"] as string;

    if (!currentUserId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (!targetUserId) {
      res.status(400).json({ status: "error", message: "Target user ID is required." });
      return;
    }

    const parsedLimit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : 50;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;
    const rawBefore = req.query["before"];
    const before = rawBefore === undefined ? undefined : parseMessageCursor(rawBefore);
    if (before === null) {
      res.status(400).json({ status: "error", message: "Invalid before cursor." });
      return;
    }

    const page = await messageRepo.getChatHistory(currentUserId, targetUserId, limit, before);
    res.status(200).json({ status: "success", data: page });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/messages
 * Saves a new message and broadcasts it to both users via Socket.io.
 * Supports image file upload under the 'image' form-data key.
 * Requires: authenticated user
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.user?.userId;
    const { receiverId: requestedReceiverId, content } = req.body ?? {};
    const receiverId = typeof requestedReceiverId === "string" ? requestedReceiverId.trim() : "";

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (!receiverId) {
      res.status(400).json({ status: "error", message: "A valid receiverId is required." });
      return;
    }

    if (content !== undefined && typeof content !== "string") {
      res.status(400).json({ status: "error", message: "Message content must be text." });
      return;
    }

    const messageContent = typeof content === "string" ? content.trim() : "";
    if (!messageContent && !req.file) {
      res.status(400).json({ status: "error", message: "Message content or an image attachment is required." });
      return;
    }

    if (messageContent.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ status: "error", message: "Message is too long (max 2000 characters)." });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ status: "error", message: "You cannot send a message to yourself." });
      return;
    }

    const recipient = await messageRepo.getMessageableUserById(senderId, receiverId);
    if (!recipient) {
      res.status(404).json({ status: "error", message: "Recipient is not available." });
      return;
    }

    // Upload attachment to Cloudinary if present
    let imageUrl: string | undefined = undefined;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "herbal_ai_messages");
    }

    const { message: newMessage, notification } = await messageRepo.saveMessageWithNotification(
      senderId,
      receiverId,
      messageContent,
      imageUrl
    );

    // Broadcast to both sender and receiver rooms via Socket.io
    const { io } = await import("../server.js");
    io.to(senderId).emit("private_message", newMessage);
    io.to(receiverId).emit("private_message", newMessage);
    io.to(receiverId).emit("notification", notification);

    res.status(201).json({ status: "success", data: { message: newMessage } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/messages/:messageId
 * Edits the text content of an existing message.
 * Requires: authenticated user to be the sender
 */
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.user?.userId;
    const messageId = parseMessageId(req.params["messageId"]);
    const { content } = req.body ?? {};

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (messageId === null) {
      res.status(400).json({ status: "error", message: "Invalid message ID." });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ status: "error", message: "Message content cannot be empty." });
      return;
    }

    const messageContent = content.trim();
    if (messageContent.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ status: "error", message: "Message is too long (max 2000 characters)." });
      return;
    }

    const existingMessage = await messageRepo.findMessageById(messageId);
    if (!existingMessage) {
      res.status(404).json({ status: "error", message: "Message not found." });
      return;
    }

    if (existingMessage.senderId !== senderId) {
      res.status(403).json({ status: "error", message: "You are not authorized to edit this message." });
      return;
    }

    if (existingMessage.isDeleted) {
      res.status(400).json({ status: "error", message: "Cannot edit a deleted message." });
      return;
    }

    const updatedMessage = await messageRepo.editMessage(messageId, messageContent, senderId);
    if (!updatedMessage) {
      res.status(409).json({ status: "error", message: "Message changed or was deleted. Refresh the conversation." });
      return;
    }

    // Broadcast update via Socket.io
    const { io } = await import("../server.js");
    io.to(existingMessage.senderId).emit("message_edited", updatedMessage);
    io.to(existingMessage.receiverId).emit("message_edited", updatedMessage);

    res.status(200).json({ status: "success", data: { message: updatedMessage } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/messages/:messageId
 * Soft deletes an existing message.
 * Requires: authenticated user to be the sender
 */
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.user?.userId;
    const messageId = parseMessageId(req.params["messageId"]);

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (messageId === null) {
      res.status(400).json({ status: "error", message: "Invalid message ID." });
      return;
    }

    const existingMessage = await messageRepo.findMessageById(messageId);
    if (!existingMessage) {
      res.status(404).json({ status: "error", message: "Message not found." });
      return;
    }

    if (existingMessage.senderId !== senderId) {
      res.status(403).json({ status: "error", message: "You are not authorized to delete this message." });
      return;
    }

    if (existingMessage.isDeleted) {
      res.status(404).json({ status: "error", message: "Message not found." });
      return;
    }

    const deletedMessage = await messageRepo.deleteMessage(messageId, senderId);
    if (!deletedMessage) {
      res.status(409).json({ status: "error", message: "Message changed or was deleted. Refresh the conversation." });
      return;
    }

    // Broadcast update via Socket.io
    const { io } = await import("../server.js");
    io.to(existingMessage.senderId).emit("message_deleted", deletedMessage);
    io.to(existingMessage.receiverId).emit("message_deleted", deletedMessage);

    res.status(200).json({ status: "success", data: { message: deletedMessage } });
  } catch (error) {
    next(error);
  }
};
