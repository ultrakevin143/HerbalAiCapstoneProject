import type { Request, Response } from "express";
import { askDrAi, streamDrAi } from "../services/chat.service.js";
import type { ChatTurn } from "../services/chat.service.js";
import { MAX_CHAT_HISTORY_TURNS } from "../schema/chat.schema.js";
import { ENV } from "../config/env.js";
import { awaitAiOperation, createAiDeadline, iterateAiOperation } from "../services/ai/core/request-lifetime.js";
import { retainDrAiHistory } from '../services/ai/chat/conversation-context.js';
import { beginChatCredit } from '../services/credit-chat.service.js';
import { CreditError } from '../config/credits.js';
import { completeCreditRequest, releaseCreditRequest } from '../repositories/credits.repository.js';
import type { CreditHandle } from '../repositories/credits.repository.js';

type CompletedChat = { reply: string; history: ChatTurn[]; sources: unknown; meta?: unknown };
const refundChatCredit = async (credit: CreditHandle | null | undefined) => {
  if (!credit || credit.replay) return;
  try { await releaseCreditRequest(credit); } catch { console.error('Credit refund awaits reservation-expiry recovery.'); }
};

const CHAT_UNAVAILABLE_MESSAGE = "Dr. Ai is temporarily unavailable. Please try again later.";

const createChatLifetime = (req: Request, res: Response) => {
  const deadline = createAiDeadline(ENV.DR_AI_REQUEST_TIMEOUT_MS);
  const onDisconnect = () => {
    if (!res.writableFinished) deadline.abort(new DOMException('Chat client disconnected.', 'AbortError'));
  };
  req.once('aborted', onDisconnect);
  res.once('close', onDisconnect);
  if (req.aborted || res.destroyed) onDisconnect();
  return {
    signal: deadline.signal,
    dispose: () => {
      req.removeListener('aborted', onDisconnect);
      res.removeListener('close', onDisconnect);
      deadline.dispose();
    },
  };
};

const appendToHistory = (history: ChatTurn[], message: string, reply: string): ChatTurn[] => {
  const newTurns: ChatTurn[] = [
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: reply }] },
  ];
  return retainDrAiHistory([...history, ...newTurns], MAX_CHAT_HISTORY_TURNS);
};

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
  let lifetime: ReturnType<typeof createChatLifetime> | undefined;
  let credit: CreditHandle | null | undefined;
  let completed = false;
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

    lifetime = createChatLifetime(req, res);
    credit = await beginChatCredit(req, message.trim(), history as ChatTurn[]);
    lifetime.signal.throwIfAborted();
    if (credit?.replay) return res.status(200).json({ status: 'success', data: credit.replay });
    const { reply, sources, metrics } = await awaitAiOperation(
      () => askDrAi(message.trim(), history as ChatTurn[], { signal: lifetime!.signal }), lifetime.signal,
    );
    lifetime.signal.throwIfAborted();
    if (metrics) {
      res.setHeader(
        "Server-Timing",
        `embedding;dur=${metrics.embeddingMs}, retrieval;dur=${metrics.retrievalMs}, generation;dur=${metrics.generationMs}`
      );
    }

    // Build the updated history to return to the frontend
    const updatedHistory = appendToHistory(history as ChatTurn[], message.trim(), reply);
    if (!reply.trim()) throw new Error('An empty answer cannot consume credits.');
    const response = {
        reply,
        history: updatedHistory,
        sources,
        meta: metrics ? { timingMs: metrics } : undefined,
    };
    if (credit) await completeCreditRequest(credit, response);
    completed = true;
    return res.status(200).json({ status: 'success', data: response });
  } catch (error) {
    if (!completed) { await refundChatCredit(credit); credit = null; }
    if (res.destroyed || req.aborted) return;
    const err = error as { message?: string; status?: number };
    console.error("Chat Controller Error:", err?.message || error);
    return res.status(error instanceof CreditError ? error.status : 503).json({
      status: "error",
      message: error instanceof CreditError ? error.message : CHAT_UNAVAILABLE_MESSAGE,
    });
  } finally {
    if (!completed) await refundChatCredit(credit);
    lifetime?.dispose();
  }
};

const writeSse = (res: Response, event: string, data: unknown) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const streamMessage = async (req: Request, res: Response) => {
  let lifetime: ReturnType<typeof createChatLifetime> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let credit: CreditHandle | null | undefined;
  let completed = false;
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
    lifetime = createChatLifetime(req, res);
    credit = await beginChatCredit(req, trimmedMessage, history as ChatTurn[]);
    lifetime.signal.throwIfAborted();
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    if (credit?.replay) {
      const replay = credit.replay as CompletedChat;
      writeSse(res, 'sources', { sources: replay.sources });
      writeSse(res, 'chunk', { text: replay.reply });
      writeSse(res, 'done', { history: replay.history, sources: replay.sources });
      return res.end();
    }
    heartbeat = setInterval(() => {
      if (!res.destroyed && !res.writableEnded) res.write(': heartbeat\n\n');
    }, 15_000);
    const stream = await awaitAiOperation(
      () => streamDrAi(trimmedMessage, history as ChatTurn[], { signal: lifetime!.signal }), lifetime.signal,
    );
    lifetime.signal.throwIfAborted();
    writeSse(res, "sources", { sources: stream.sources });

    for await (const text of iterateAiOperation(stream.chunks, lifetime.signal)) {
      lifetime.signal.throwIfAborted();
      writeSse(res, "chunk", { text });
    }

    lifetime.signal.throwIfAborted();
    const result = stream.getResult();
    const updatedHistory = appendToHistory(history as ChatTurn[], trimmedMessage, result.reply);
    if (!result.reply.trim()) throw new Error('An empty answer cannot consume credits.');
    if (credit) await completeCreditRequest(credit, { reply: result.reply, history: updatedHistory, sources: result.sources, meta: result.metrics ? { timingMs: result.metrics } : undefined });
    completed = true;
    writeSse(res, "done", { history: updatedHistory, sources: result.sources, metrics: result.metrics });
    return res.end();
  } catch (error) {
    if (!completed) { await refundChatCredit(credit); credit = null; }
    if (res.destroyed || req.aborted) return;
    const err = error as { message?: string; status?: number };
    console.error("Streaming Chat Controller Error:", err?.message || error);
    if (!res.headersSent) {
      return res.status(error instanceof CreditError ? error.status : 503).json({
        status: "error",
        message: error instanceof CreditError ? error.message : CHAT_UNAVAILABLE_MESSAGE,
      });
    }
    writeSse(res, "error", { message: CHAT_UNAVAILABLE_MESSAGE });
    return res.end();
  } finally {
    if (!completed) await refundChatCredit(credit);
    clearInterval(heartbeat);
    lifetime?.dispose();
  }
};
