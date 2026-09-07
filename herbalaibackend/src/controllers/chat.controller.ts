import type { Request, Response } from "express";
import { askDrAi, streamDrAi } from "../services/chat.service.js";
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

    const { reply, sources, metrics } = await askDrAi(message.trim(), history as ChatTurn[]);
    if (metrics) {
      res.setHeader(
        "Server-Timing",
        `embedding;dur=${metrics.embeddingMs}, retrieval;dur=${metrics.retrievalMs}, generation;dur=${metrics.generationMs}`
      );
    }

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
        meta: metrics ? { timingMs: metrics } : undefined,
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

const writeSse = (res: Response, event: string, data: unknown) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const streamMessage = async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ status: "error", message: "A non-empty message is required." });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ status: "error", message: "Message is too long. Please keep it under 1000 characters." });
    }
    if (!Array.isArray(history)) {
      return res.status(400).json({ status: "error", message: "History must be an array of conversation turns." });
    }

    const trimmedMessage = message.trim();
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const stream = await streamDrAi(trimmedMessage, history as ChatTurn[]);
    writeSse(res, "sources", { sources: stream.sources });

    for await (const text of stream.chunks) {
      if (res.destroyed) return;
      writeSse(res, "chunk", { text });
    }

    const result = stream.getResult();
    const updatedHistory: ChatTurn[] = [
      ...history,
      { role: "user", parts: [{ text: trimmedMessage }] },
      { role: "model", parts: [{ text: result.reply }] },
    ];
    writeSse(res, "done", { history: updatedHistory, sources: result.sources, metrics: result.metrics });
    return res.end();
  } catch (error) {
    const err = error as { message?: string; status?: number };
    console.error("Streaming Chat Controller Error:", err?.message || error);
    if (!res.headersSent) {
      return res.status(err?.status || 500).json({
        status: "error",
        message: err?.message || "Dr. Ai assistant is currently unavailable. Please try again later.",
      });
    }
    writeSse(res, "error", { message: err?.message || "Dr. Ai assistant is currently unavailable. Please try again later." });
    return res.end();
  }
};
