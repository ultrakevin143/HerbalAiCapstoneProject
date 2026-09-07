import { searchSimilarKB } from "../../../repositories/knowledgebase.repository.js";
import { findAllHerbs, searchSimilarHerbs } from "../../../repositories/herb.repository.js";
import { generateEmbedding, generateChatResponse, generateChatResponseStream } from "../core/gemini-service.js";
import type { Content } from "@google/generative-ai";
import type { HerbQueryResult } from "../../../repositories/herb.repository.js";
import type { KBQueryResult } from "../../../repositories/knowledgebase.repository.js";

const STOP_WORDS = new Set([
  "a", "about", "and", "are", "for", "from", "how", "is", "it", "of", "on", "or", "the", "this", "to", "what", "with",
]);

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const meaningfulTokens = (value: string) =>
  new Set(normalize(value).split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token)));

const lexicalOverlap = (question: string, candidate: string) => {
  const questionTokens = meaningfulTokens(question);
  if (questionTokens.size === 0) return 0;
  const candidateTokens = meaningfulTokens(candidate);
  let matches = 0;
  questionTokens.forEach((token) => {
    if (candidateTokens.has(token)) matches += 1;
  });
  return matches / questionTokens.size;
};

const configuredDistance = Number(process.env["DR_AI_MAX_COSINE_DISTANCE"] ?? "0.52");
const MAX_COSINE_DISTANCE = Number.isFinite(configuredDistance) ? configuredDistance : 0.52;
const DISTANCE_MARGIN = 0.08;

function selectCloseMatches<T extends { distance: number }>(results: T[], limit = 2): T[] {
  const eligible = results.filter((result) => Number(result.distance) <= MAX_COSINE_DISTANCE);
  if (eligible.length === 0) return [];
  const bestDistance = Number(eligible[0]?.distance ?? MAX_COSINE_DISTANCE);
  return eligible
    .filter((result) => Number(result.distance) <= Math.min(MAX_COSINE_DISTANCE, bestDistance + DISTANCE_MARGIN))
    .slice(0, limit);
}

export interface DrAiTimingMetrics {
  embeddingMs: number;
  retrievalMs: number;
  generationMs: number;
  totalMs: number;
}

export interface DrAiSource {
  type: "herb" | "kb";
  title: string;
  distance: number;
}

interface PreparedDrAiContext {
  context: string;
  sources: DrAiSource[];
  embeddingMs: number;
  retrievalMs: number;
  herbSourceCount: number;
  knowledgeBaseSourceCount: number;
  bestDistance: number;
}

async function prepareDrAiContext(question: string): Promise<PreparedDrAiContext> {
  const catalogStartedAt = performance.now();
  const { herbs: catalog } = await findAllHerbs();
  const normalizedQuestion = normalize(question);
  const namedHerbs = catalog.filter((herb) =>
    herb.isVerified !== false && [herb.localName, herb.scientificName]
      .map(normalize)
      .some((name) => name.length > 2 && normalizedQuestion.includes(name))
  ).slice(0, 2);

  if (namedHerbs.length > 0) {
    const context = "Verified Herb Information:\n" + namedHerbs.map((herb) =>
      `Local Name: ${herb.localName} (Scientific: ${herb.scientificName})\n` +
      `Medicinal Uses: ${herb.medicinalUses}\n` +
      `Preparation: ${herb.preparationMethod}\n` +
      `Dosage: ${herb.dosage}\n` +
      `Warnings: ${herb.warnings || "None declared."}`
    ).join("\n\n") + "\n\n";
    return {
      context,
      sources: namedHerbs.map((herb) => ({ type: "herb", title: herb.localName, distance: 0 })),
      embeddingMs: 0,
      retrievalMs: performance.now() - catalogStartedAt,
      herbSourceCount: namedHerbs.length,
      knowledgeBaseSourceCount: 0,
      bestDistance: 0,
    };
  }

  const embeddingStartedAt = performance.now();
  const embedding = await generateEmbedding(question);
  const embeddingMs = performance.now() - embeddingStartedAt;
  const vectorStr = `[${embedding.join(",")}]`;

  const retrievalStartedAt = performance.now();
  const [rawKB, rawHerbs] = await Promise.all([
    searchSimilarKB(vectorStr, 3),
    searchSimilarHerbs(vectorStr, 3)
  ]);
  const retrievalMs = performance.now() - retrievalStartedAt;

  const explicitlyNamedHerbs = rawHerbs.filter((herb) =>
    [herb.localName, herb.scientificName]
      .map(normalize)
      .some((name) => name.length > 2 && normalizedQuestion.includes(name))
  );

  const closeKB = selectCloseMatches(rawKB, 2);
  const kbWithScores = closeKB.map((entry) => ({
    entry,
    lexicalScore: lexicalOverlap(question, `${entry.question ?? ""} ${entry.answer}`),
  }));
  const strongestKBScore = Math.max(0, ...kbWithScores.map(({ lexicalScore }) => lexicalScore));
  const relevantKB = kbWithScores
    .filter(({ lexicalScore }) => strongestKBScore < 0.3 || lexicalScore >= Math.max(0.2, strongestKBScore - 0.15))
    .map(({ entry }) => entry);
  const hasStrongKBMatch = strongestKBScore >= 0.3;

  const semanticallyCloseHerbs = selectCloseMatches(rawHerbs, 2).filter((herb) =>
    lexicalOverlap(
      question,
      `${herb.localName} ${herb.scientificName} ${herb.medicinalUses} ${herb.warnings ?? ""}`
    ) >= 0.2
  );

  const relevantHerbs = explicitlyNamedHerbs.length > 0
    ? explicitlyNamedHerbs.slice(0, 2)
    : hasStrongKBMatch
      ? []
      : semanticallyCloseHerbs;

  let context = "";
  if (relevantHerbs.length > 0) {
    context += "Verified Herb Information:\n" + relevantHerbs.map((h: HerbQueryResult) =>
      `Local Name: ${h.localName} (Scientific: ${h.scientificName})\n` +
      `Medicinal Uses: ${h.medicinalUses}\n` +
      `Preparation: ${h.preparationMethod}\n` +
      `Dosage: ${h.dosage}\n` +
      `Warnings: ${h.warnings || "None declared."}`
    ).join("\n\n") + "\n\n";
  }
  if (relevantKB.length > 0) {
    context += "General Knowledge Base / FAQs:\n" + relevantKB.map((k: KBQueryResult) =>
      `Q: ${k.question || "Untitled Question"}\nA: ${k.answer}`
    ).join("\n\n") + "\n\n";
  }
  if (!context) context = "No specific knowledge base or verified herb documents found matching this query in the database.";

  const sources: DrAiSource[] = [
    ...relevantHerbs.map((h: HerbQueryResult) => ({ type: "herb" as const, title: h.localName, distance: h.distance })),
    ...relevantKB.map((k: KBQueryResult) => ({ type: "kb" as const, title: k.question || "FAQ Source", distance: k.distance })),
  ];

  return {
    context,
    sources,
    embeddingMs,
    retrievalMs,
    herbSourceCount: relevantHerbs.length,
    knowledgeBaseSourceCount: relevantKB.length,
    bestDistance: Math.min(...sources.map((source) => Number(source.distance)), 1),
  };
}

const logMetrics = (question: string, prepared: PreparedDrAiContext, metrics: DrAiTimingMetrics) => {
  console.info(JSON.stringify({
    event: "dr_ai_request",
    ...metrics,
    questionLength: question.length,
    herbSources: prepared.herbSourceCount,
    knowledgeBaseSources: prepared.knowledgeBaseSourceCount,
    bestDistance: prepared.bestDistance,
  }));
};

export async function AskAIService(question: string, history: Content[] = []) {
  const totalStartedAt = performance.now();
  try {
    const prepared = await prepareDrAiContext(question);
    const generationStartedAt = performance.now();
    const answer = await generateChatResponse(question, prepared.context, history);
    const generationMs = performance.now() - generationStartedAt;
    const metrics: DrAiTimingMetrics = {
      embeddingMs: Number(prepared.embeddingMs.toFixed(1)),
      retrievalMs: Number(prepared.retrievalMs.toFixed(1)),
      generationMs: Number(generationMs.toFixed(1)),
      totalMs: Number((performance.now() - totalStartedAt).toFixed(1)),
    };
    logMetrics(question, prepared, metrics);

    return {
      code: 200,
      status: "success",
      data: {
        answer,
        sources: prepared.sources,
        metrics,
      },
    };
  } catch (error) {
    console.error("AskAIService Error:", error);
    return { code: 500, status: "error", message: "Dr. Ai assistant is currently unavailable." };
  }
}

export async function createDrAiStream(question: string, history: Content[] = []) {
  const totalStartedAt = performance.now();
  const prepared = await prepareDrAiContext(question);
  const generationStartedAt = performance.now();
  let firstChunkMs: number | undefined;
  const sourceNames = prepared.sources.map((source) => source.title).slice(0, 2);
  const initialText = sourceNames.length > 0
    ? `I found verified Herbal AI information for ${sourceNames.join(" and ")}. Here is a clearer explanation:\n\n`
    : "I could not find a sufficiently relevant verified record for that question. Here is what I can safely explain from the available context:\n\n";
  let reply = "";

  const chunks = async function* () {
    firstChunkMs = performance.now() - generationStartedAt;
    reply += initialText;
    yield initialText;
    for await (const text of generateChatResponseStream(question, prepared.context, history)) {
      reply += text;
      yield text;
    }
  };

  const getResult = () => {
    const generationMs = performance.now() - generationStartedAt;
    const metrics: DrAiTimingMetrics & { firstChunkMs: number } = {
      embeddingMs: Number(prepared.embeddingMs.toFixed(1)),
      retrievalMs: Number(prepared.retrievalMs.toFixed(1)),
      generationMs: Number(generationMs.toFixed(1)),
      totalMs: Number((performance.now() - totalStartedAt).toFixed(1)),
      firstChunkMs: Number((firstChunkMs ?? generationMs).toFixed(1)),
    };
    logMetrics(question, prepared, metrics);
    return { reply, sources: prepared.sources, metrics };
  };

  return { chunks: chunks(), sources: prepared.sources, getResult };
}
