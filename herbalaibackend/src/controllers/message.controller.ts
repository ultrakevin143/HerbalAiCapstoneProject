import type { Request, Response, NextFunction } from "express";
import * as messageRepo from "../repositories/message.repository.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

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

    const users = await messageRepo.getMessageableUsers(currentUserId);
    res.status(200).json({ status: "success", data: { users } });
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

    const conversations = await messageRepo.getActiveConversations(currentUserId);
    res.status(200).json({ status: "success", data: { conversations } });
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
    const beforeTime = req.query["before"] ? new Date(req.query["before"] as string) : undefined;
    if (beforeTime && Number.isNaN(beforeTime.getTime())) {
      res.status(400).json({ status: "error", message: "Invalid before cursor." });
      return;
    }

    const page = await messageRepo.getChatHistory(currentUserId, targetUserId, limit, beforeTime);
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
    const { receiverId, content } = req.body;

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (!receiverId || typeof receiverId !== "string") {
      res.status(400).json({ status: "error", message: "A valid receiverId is required." });
      return;
    }

    // Message must have either content or an uploaded image attachment
    if ((!content || typeof content !== "string" || !content.trim()) && !req.file) {
      res.status(400).json({ status: "error", message: "Message content or an image attachment is required." });
      return;
    }

    if (content && content.trim().length > 2000) {
      res.status(400).json({ status: "error", message: "Message is too long (max 2000 characters)." });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ status: "error", message: "You cannot send a message to yourself." });
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
      content ? content.trim() : "",
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
    const messageId = parseInt(req.params["messageId"] as string, 10);
    const { content } = req.body;

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (isNaN(messageId)) {
      res.status(400).json({ status: "error", message: "Invalid message ID." });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ status: "error", message: "Message content cannot be empty." });
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

    const updatedMessage = await messageRepo.editMessage(messageId, content.trim());

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
    const messageId = parseInt(req.params["messageId"] as string, 10);

    if (!senderId) {
      res.status(401).json({ status: "error", message: "Authentication required." });
      return;
    }

    if (isNaN(messageId)) {
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

    const deletedMessage = await messageRepo.deleteMessage(messageId);

    // Broadcast update via Socket.io
    const { io } = await import("../server.js");
    io.to(existingMessage.senderId).emit("message_deleted", deletedMessage);
    io.to(existingMessage.receiverId).emit("message_deleted", deletedMessage);

    res.status(200).json({ status: "success", data: { message: deletedMessage } });
  } catch (error) {
    next(error);
  }
};
