import { AskAIService } from "./ai/chat/ask-ai-service.js";
import { createDrAiStream } from "./ai/chat/ask-ai-service.js";
import type { DrAiTimingMetrics } from "./ai/chat/ask-ai-service.js";

/**
 * Represents a single message in a conversation history.
 * Gemini uses "user" and "model" roles.
 */
export interface ChatTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface Source {
  type: 'herb' | 'kb';
  title: string;
  distance?: number;
}

const safetyReply = (userMessage: string): string | null => {
  const lowerMsg = userMessage.toLowerCase();
  const offTopicKeywords = [
    "bomb", "weapon", "hack", "illegal", "kill", "suicide",
    "how to make drugs", "synthetic drug", "shabu", "meth",
  ];
  return offTopicKeywords.some((keyword) => lowerMsg.includes(keyword))
    ? "I'm sorry, I can only help with Philippine herbal medicine questions. For that topic, please seek appropriate professional help.\n\n⚠️ *Disclaimer: This information is for traditional knowledge guidance only and does NOT constitute medical advice. Always consult a licensed physician.*"
    : null;
};

/**
 * Sends a message to Dr. Ai (Gemini) using RAG retrieval from the database
 * and returns the response text and references sources.
 *
 * @param userMessage   - The current user query
 * @param history       - The previous turns in this conversation session
 * @returns             - An object containing Dr. Ai's response and sources
 */
export const askDrAi = async (
  userMessage: string,
  history: ChatTurn[] = []
): Promise<{ reply: string; sources: Source[]; metrics?: DrAiTimingMetrics }> => {
  // Safety check — block clearly off-topic or dangerous queries before querying db/AI
  const blockedReply = safetyReply(userMessage);
  if (blockedReply) {
    return {
      reply: blockedReply,
      sources: [],
    };
  }

  // Delegate RAG flow to AskAIService
  const result = await AskAIService(userMessage, history);
  
  if (result.status === "error") {
    throw {
      status: result.code || 500,
      message: result.message || "Dr. Ai is temporarily unavailable.",
    };
  }

  return {
    reply: result.data!.answer,
    sources: result.data!.sources || [],
    ...(result.data!.metrics ? { metrics: result.data!.metrics } : {}),
  };
};

export const streamDrAi = async (userMessage: string, history: ChatTurn[] = []) => {
  const blockedReply = safetyReply(userMessage);
  if (blockedReply) {
    const chunks = async function* () { yield blockedReply; };
    return {
      chunks: chunks(),
      sources: [] as Source[],
      getResult: () => ({ reply: blockedReply, sources: [] as Source[], metrics: undefined }),
    };
  }
  return createDrAiStream(userMessage, history);
};
