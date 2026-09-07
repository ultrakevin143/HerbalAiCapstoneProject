import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";
import { ENV } from "../../../config/env.js";
import { DR_AI_SYSTEM_PROMPT } from "../../../config/drAiSystemPrompt.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");

const CHAT_MODELS = ENV.DR_AI_CHAT_MODELS;
const CHAT_REQUEST_OPTIONS = { timeout: ENV.DR_AI_MODEL_TIMEOUT_MS };

const EMBEDDING_MODEL = "gemini-embedding-2";

const buildGroundedPrompt = (prompt: string, context: string) => `Below is the Context retrieved from the Herbal AI database. It is the only allowed source for herb-specific facts. Answer the user's question by paraphrasing and organizing this material into a clearer explanation. Preserve its meaning and do not add details merely to make the answer longer. Do not fill missing facts from general model knowledge. If the Context has no sufficiently relevant verified record, state that limitation and do not guess.

Context:
${context}

Question: ${prompt}`;

const createChat = (modelName: string, history: Content[]) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: DR_AI_SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });

  return model.startChat({ history: history.slice(-6) });
};

/**
 * Utility to chunk text for embeddings.
 * If the text exceeds 2000 characters, it is split into chunks with a 200-character overlap.
 */
function chunkText(text: string, size: number = 2000, overlap: number = 200): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
    if (start >= text.length - overlap && start < text.length) break;
  }
  return chunks;
}

/**
 * Generate an embedding for a given text using Gemini.
 * Chunks long text and returns the averaged embedding.
 * @param text The input text to embed.
 * @returns An array of numbers representing the vector (768 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const chunks = chunkText(text);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const embedOptions = (t: string) => ({
    content: { parts: [{ text: t }], role: "user" },
    outputDimensionality: 768
  });

  const firstChunk = chunks[0];
  if (!firstChunk) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  if (chunks.length === 1) {
    const result = await model.embedContent(embedOptions(firstChunk));
    return result.embedding.values;
  }

  const results = await Promise.all(
    chunks.map(chunk => model.embedContent(embedOptions(chunk)))
  );
  const embeddings = results.map(r => r.embedding.values);

  // Average embeddings to maintain single-vector compatibility
  const firstEmb = embeddings[0];
  if (!firstEmb) {
    throw new Error("Failed to generate any embeddings.");
  }

  const dim = firstEmb.length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i] ?? 0;
    }
  }
  return avg.map(v => v / embeddings.length);
}

/**
 * Generate a chat response based on a prompt and provided context.
 * Includes a multi-model fallback to maximize free-tier limits.
 * @param prompt The user's question.
 * @param context The retrieved knowledge chunks from database.
 * @param history Optional chat history for conversational memory.
 * @returns The AI's response text.
 */
export async function generateChatResponse(
  prompt: string,
  context: string,
  history: Content[] = []
): Promise<string> {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const fullPrompt = buildGroundedPrompt(prompt, context);

  let lastError: Error | null = null;

  for (const modelName of CHAT_MODELS) {
    try {
      const chat = createChat(modelName, history);

      const result = await chat.sendMessage(fullPrompt, CHAT_REQUEST_OPTIONS);

      // Log token usage for tracking
      if (result.response.usageMetadata) {
        console.log(`📊 AI Token Usage [${modelName}] | Prompt: ${result.response.usageMetadata.promptTokenCount} | Response: ${result.response.usageMetadata.candidatesTokenCount} | Total: ${result.response.usageMetadata.totalTokenCount}`);
      }

      const text = result.response.text();
      if (!text) throw new Error("Empty response from model");
      return text;
    } catch (error) {
      const err = error as Error;
      console.warn(`Model ${modelName} failed:`, err.message);
      lastError = err;

      // Move immediately to the next configured model. Each attempt has its own
      // timeout, so one unavailable provider model cannot consume the whole request.
    }
  }

  throw new Error(`All Gemini models hit limits or failed. Last error: ${lastError?.message || "Unknown error"}`);
}

export async function* generateChatResponseStream(
  prompt: string,
  context: string,
  history: Content[] = []
): AsyncGenerator<string> {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const fullPrompt = buildGroundedPrompt(prompt, context);
  let lastError: Error | null = null;

  for (const modelName of CHAT_MODELS) {
    let emittedText = false;
    try {
      const result = await createChat(modelName, history).sendMessageStream(fullPrompt, CHAT_REQUEST_OPTIONS);
      // The SDK aggregates the response concurrently with iteration. Observe its
      // rejection immediately; an interrupted stream otherwise risks an unhandled rejection.
      void result.response.catch(() => undefined);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          emittedText = true;
          yield text;
        }
      }

      const response = await result.response;
      if (response.usageMetadata) {
        console.log(`📊 AI Token Usage [${modelName}] | Prompt: ${response.usageMetadata.promptTokenCount} | Response: ${response.usageMetadata.candidatesTokenCount} | Total: ${response.usageMetadata.totalTokenCount}`);
      }
      if (!emittedText) throw new Error("Empty response from model");
      return;
    } catch (error) {
      const err = error as Error;
      if (emittedText) throw err;
      console.warn(`Streaming model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All Gemini models hit limits or failed. Last error: ${lastError?.message || "Unknown error"}`);
}
