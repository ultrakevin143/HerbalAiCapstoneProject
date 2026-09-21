import { findActiveKBByTerms, searchSimilarKB } from "../../../repositories/knowledgebase.repository.js";
import { findAllHerbs, searchSimilarHerbs } from "../../../repositories/herb.repository.js";
import { generateEmbedding, generateChatResponse, generateChatResponseStream } from "../core/gemini-service.js";
import type { Content } from "@google/generative-ai";
import type { HerbQueryResult } from "../../../repositories/herb.repository.js";
import type { KBQueryResult } from "../../../repositories/knowledgebase.repository.js";

const STOP_WORDS = new Set([
  "a", "about", "and", "are", "dose", "dosage", "for", "from", "guidance", "herb", "herbal", "how", "is", "it",
  "medicine", "of", "on", "or", "plant", "preparation", "prepare", "safety", "should", "take", "the", "this", "to",
  "traditional", "use", "used", "uses", "what", "with",
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

type CatalogHerb = Awaited<ReturnType<typeof findAllHerbs>>['herbs'][number];

const formatHerbContext = (herb: HerbQueryResult | CatalogHerb, index: number) =>
  `[Herb ${index + 1}] Repository record (reviewed content; not a claim of clinical proof):\n${JSON.stringify({
    localName: herb.localName,
    scientificName: herb.scientificName,
    medicinalUses: herb.medicinalUses,
    preparation: herb.preparationMethod || 'Not documented in this record.',
    dosageField: herb.dosage || 'Not documented in this record.',
    warnings: herb.warnings || 'Not documented; this does not establish safety.',
    ...('evidenceClass' in herb ? { evidenceClass: herb.evidenceClass } : {}),
    ...('sources' in herb ? { references: herb.sources } : {}),
  })}`;

interface RetrievedKB {
  id: string;
  question: string | null;
  answer: string;
  category: string | null;
  tags: string[];
  metadata: unknown;
  distance?: number;
}

const formatKBContext = (entries: RetrievedKB[]) => entries.map((entry, index) =>
  `[FAQ ${index + 1}] ${JSON.stringify({
    question: entry.question || 'Untitled Question',
    answer: entry.answer,
    category: entry.category,
    tags: entry.tags,
    sourceMetadata: entry.metadata,
  })}`
).join('\n\n');

async function prepareDrAiContext(question: string, history: Content[] = []): Promise<PreparedDrAiContext> {
  const catalogStartedAt = performance.now();
  const { herbs: catalog } = await findAllHerbs();
  const normalizedQuestion = normalize(question);
  let namedHerbs = catalog.filter((herb) =>
    herb.isVerified !== false && [herb.localName, herb.scientificName]
      .map(normalize)
      .some((name) => name.length > 2 && normalizedQuestion.includes(name))
  ).slice(0, 2);

  if (namedHerbs.length === 0 && /\b(it|its|that|this|those|them|prepare|preparation|dosage|dose|frequency|how much|how often)\b/i.test(question)) {
    const previousUserQuestion = [...history].reverse().find((turn) => turn.role === 'user');
    const previousText = normalize(previousUserQuestion?.parts.map((part) => part.text ?? '').join(' ') ?? '');
    const previousHerbs = catalog.filter((herb) =>
      [herb.localName, herb.scientificName].map(normalize)
        .some((name) => name.length > 2 && previousText.includes(name))
    );
    if (previousHerbs.length === 1 && /\b(it|its|that|this|those|them)\b/i.test(question)) namedHerbs = previousHerbs;
  }

  if (namedHerbs.length > 0) {
    const exactTerms = namedHerbs.flatMap((herb) => [
      normalize(herb.localName),
      normalize(herb.scientificName),
      ...normalize(herb.localName).split(' '),
    ]);
    const namedKnowledge = await findActiveKBByTerms(exactTerms, 3);
    const context = [
      namedHerbs.map(formatHerbContext).join("\n\n"),
      namedKnowledge.length > 0 ? `General Knowledge Base / FAQs:\n${formatKBContext(namedKnowledge)}` : '',
    ].filter(Boolean).join('\n\n');
    return {
      context,
      sources: [
        ...namedHerbs.map((herb) => ({ type: "herb" as const, title: herb.localName, distance: 0 })),
        ...namedKnowledge.map((entry) => ({ type: "kb" as const, title: entry.question, distance: 0 })),
      ],
      embeddingMs: 0,
      retrievalMs: performance.now() - catalogStartedAt,
      herbSourceCount: namedHerbs.length,
      knowledgeBaseSourceCount: namedKnowledge.length,
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
    .filter(({ lexicalScore }) =>
      strongestKBScore >= 0.2 && lexicalScore >= Math.max(0.2, strongestKBScore - 0.15)
    )
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
    context += relevantHerbs.map((herb, index) =>
      formatHerbContext(catalog.find((entry) => entry.id === herb.id) ?? herb, index)
    ).join("\n\n") + "\n\n";
  }
  if (relevantKB.length > 0) {
    context += `General Knowledge Base / FAQs:\n${formatKBContext(relevantKB)}\n\n`;
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
    const prepared = await prepareDrAiContext(question, history);
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
  const prepared = await prepareDrAiContext(question, history);
  const generationStartedAt = performance.now();
  let firstChunkMs: number | undefined;
  let reply = "";

  const chunks = async function* () {
    for await (const text of generateChatResponseStream(question, prepared.context, history)) {
      firstChunkMs ??= performance.now() - generationStartedAt;
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
