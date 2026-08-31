import type { Request, Response } from "express";
import { askDrAi } from "../services/chat.service.js";
import type { ChatTurn } from "../services/chat.service.js";

/**
 * POST /api/chat
 *
 * Body:
 *   message  {string}     - The user's current query to Dr. Ai
 *   history  {ChatTurn[]} - (Optional) Previous conversation turns for context
 *
 * Returns:
 *   reply    {string}     - Dr. Ai's response text
 *   history  {ChatTurn[]} - Updated conversation history (append & send back next time)
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        status: "error",
        message: "A non-empty message is required.",
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        status: "error",
        message: "Message is too long. Please keep it under 1000 characters.",
      });
    }

    // Validate history shape (must be array of {role, parts} objects)
    if (!Array.isArray(history)) {
      return res.status(400).json({
        status: "error",
        message: "History must be an array of conversation turns.",
      });
    }

    const { reply, sources } = await askDrAi(message.trim(), history as ChatTurn[]);

    // Build the updated history to return to the frontend
    const updatedHistory: ChatTurn[] = [
      ...history,
      { role: "user", parts: [{ text: message.trim() }] },
      { role: "model", parts: [{ text: reply }] },
    ];

    return res.status(200).json({
      status: "success",
      data: {
        reply,
        history: updatedHistory,
        sources,
      },
    });
  } catch (error) {
    const err = error as { message?: string; status?: number };
    console.error("Chat Controller Error:", err?.message || error);
    const statusCode = err?.status || 500;
    return res.status(statusCode).json({
      status: "error",
      message: err?.message || "Dr. Ai assistant is currently unavailable. Please try again later.",
    });
  }
};
