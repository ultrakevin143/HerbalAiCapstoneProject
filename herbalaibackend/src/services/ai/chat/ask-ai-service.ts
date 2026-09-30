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
  fallbackReply: string;
  sources: DrAiSource[];
  embeddingMs: number;
  retrievalMs: number;
  herbSourceCount: number;
  knowledgeBaseSourceCount: number;
  bestDistance: number;
}

type CatalogHerb = Awaited<ReturnType<typeof findAllHerbs>>['herbs'][number];

const NO_MATCH_CONTEXT = "No specific knowledge base or verified herb documents found matching this query in the database.";
const NO_MATCH_REPLY = "I could not find a verified Herbal-Ai source for this question. I cannot confirm treatment or cure claims without a documented record. Please consult a licensed health professional for medical decisions.";
const isPediatricQuestion = (question: string) => /\b(child|children|kid|kids|baby|infant|newborn|toddler|pediatric|paediatric|anak|bata|sanggol)\b|\b(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ](?:year|month)[- ]old\b|\b(?:age(?:d)?\s*)?\d{1,2}\s*(?:yo|y\/o|mo|months? old|taong gulang)\b/i.test(question);
const isPediatricRequest = (question: string, history: Content[]) => {
  if (isPediatricQuestion(question)) return true;
  if (/\b(adult|grown-up)\b/i.test(question) || !/\b(it|its|this|that|them|give|dose|dosage|how much|how often)\b/i.test(question)) return false;
  const previousQuestion = [...history].reverse().find((turn) => turn.role === 'user');
  return isPediatricQuestion(previousQuestion?.parts.map((part) => part.text ?? '').join(' ') ?? '');
};
export const withoutPediatricQuantities = (value: string) => value.split(/(?<=[.!?])\s+(?=[A-Z])|\r?\n/u)
  .map((sentence) => /\b(?:age-based|ages?\s+\d|children?\s+\d|\d+\s*(?:[-–]\s*\d+\s*)?(?:years?|yrs?)\b)/i.test(sentence)
    && /\d/.test(sentence)
    ? 'Age-specific ingredient quantities are recorded in the source but are not repeated here; consult a licensed clinician for pediatric use.'
    : sentence)
  .join(' ');
const RETRIEVAL_UNAVAILABLE_CONTEXT = "Herbal-Ai could not complete repository retrieval for this question.";
const RETRIEVAL_UNAVAILABLE_REPLY = "I could not check the Herbal-Ai sources right now, so I cannot verify this claim or recommend a treatment. Please try again later or browse the library directly. Consult a licensed health professional for medical decisions.";

const buildSourceFallback = (herbs: Array<CatalogHerb | HerbQueryResult>, entries: RetrievedKB[], pediatricRequest: boolean) => {
  if (herbs.length === 0 && entries.length === 0) return NO_MATCH_REPLY;
  if (pediatricRequest) {
    const names = herbs.slice(0, 2).map((herb) => herb.localName).join(', ');
    return `Herbal-Ai has ${names ? `a record for ${names}` : 'a related repository record'}, but Dr. Ai cannot provide child-specific preparation or dosing guidance. Consult a licensed clinician before giving an herbal preparation to a child. This is educational information, not medical advice.`;
  }

  const herbRecords = herbs.slice(0, 2).map((herb) => [
    `${herb.localName} (${herb.scientificName})`,
    `Documented uses: ${herb.medicinalUses || 'Not documented in this record.'}`,
    `Preparation: ${withoutPediatricQuantities(herb.preparationMethod || 'Not documented in this record.')}`,
    'Recorded dosage: Consult the library record; Dr. Ai cannot synthesize a dose while generation is unavailable.',
    `Warnings: ${herb.warnings || 'Not documented; this does not establish safety.'}`,
  ].join('\n'));
  const faqRecords = entries.slice(0, 2).map((entry) =>
    `${entry.question || 'Library FAQ'}: ${withoutPediatricQuantities(entry.answer)}`
  );

  return [
    'Dr. Ai could not complete a generated answer. The fields below retain the library wording; translation and synthesis are unavailable right now.',
    ...herbRecords,
    ...faqRecords,
    'Educational information only. This is not a diagnosis or prescription; consult a licensed health professional for medical decisions.',
  ].join('\n\n');
};

const formatHerbContext = (herb: HerbQueryResult | CatalogHerb, index: number, question: string, pediatricRequest: boolean) =>
  `[Herb ${index + 1}] Repository record (reviewed content; not a claim of clinical proof):\n${JSON.stringify({
    localName: herb.localName,
    scientificName: herb.scientificName,
    medicinalUses: herb.medicinalUses,
    preparation: pediatricRequest ? 'Pediatric preparation instructions withheld; consult a licensed clinician.' : withoutPediatricQuantities(herb.preparationMethod || 'Not documented in this record.'),
    ...(/\b(dose|dosage|amount|how much|frequency|how often)\b/i.test(question) && !pediatricRequest
      ? { dosageField: withoutPediatricQuantities(herb.dosage || 'Not documented in this record.') }
      : {}),
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
    answer: withoutPediatricQuantities(entry.answer),
    category: entry.category,
    tags: entry.tags,
    sourceMetadata: entry.metadata,
  })}`
).join('\n\n');

async function prepareDrAiContext(question: string, history: Content[], pediatricRequest: boolean): Promise<PreparedDrAiContext> {
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
      namedHerbs.map((herb, index) => formatHerbContext(herb, index, question, pediatricRequest)).join("\n\n"),
      namedKnowledge.length > 0 && !pediatricRequest ? `General Knowledge Base / FAQs:\n${formatKBContext(namedKnowledge)}` : '',
    ].filter(Boolean).join('\n\n');
    return {
      context,
      fallbackReply: buildSourceFallback(namedHerbs, namedKnowledge, pediatricRequest),
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
  let embedding: number[];
  try {
    embedding = await generateEmbedding(question);
  } catch {
    console.warn('Dr. Ai embedding unavailable; repository retrieval could not finish.');
    return {
      context: RETRIEVAL_UNAVAILABLE_CONTEXT,
      fallbackReply: RETRIEVAL_UNAVAILABLE_REPLY,
      sources: [],
      embeddingMs: performance.now() - embeddingStartedAt,
      retrievalMs: 0,
      herbSourceCount: 0,
      knowledgeBaseSourceCount: 0,
      bestDistance: 1,
    };
  }
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

  const contextualHerbs = relevantHerbs.map((herb) => catalog.find((entry) => entry.id === herb.id) ?? herb);
  let context = "";
  if (relevantHerbs.length > 0) {
    context += contextualHerbs.map((herb, index) =>
      formatHerbContext(herb, index, question, pediatricRequest)
    ).join("\n\n") + "\n\n";
  }
  if (relevantKB.length > 0 && !pediatricRequest) {
    context += `General Knowledge Base / FAQs:\n${formatKBContext(relevantKB)}\n\n`;
  }
  if (!context) context = NO_MATCH_CONTEXT;

  const sources: DrAiSource[] = [
    ...relevantHerbs.map((h: HerbQueryResult) => ({ type: "herb" as const, title: h.localName, distance: h.distance })),
    ...relevantKB.map((k: KBQueryResult) => ({ type: "kb" as const, title: k.question || "FAQ Source", distance: k.distance })),
  ];

  return {
    context,
    fallbackReply: buildSourceFallback(contextualHerbs, relevantKB, pediatricRequest),
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
    const pediatricRequest = isPediatricRequest(question, history);
    const prepared = await prepareDrAiContext(question, history, pediatricRequest);
    const generationStartedAt = performance.now();
    let answer = prepared.fallbackReply;
    if (prepared.sources.length > 0 && !pediatricRequest) {
      try {
        answer = await generateChatResponse(question, prepared.context, history);
      } catch {
        console.warn('Dr. Ai generation unavailable; using retrieved records.');
      }
    }
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
  const pediatricRequest = isPediatricRequest(question, history);
  const prepared = await prepareDrAiContext(question, history, pediatricRequest);
  const generationStartedAt = performance.now();
  let firstChunkMs: number | undefined;
  let reply = "";

  const chunks = async function* () {
    if (prepared.sources.length === 0 || pediatricRequest) {
      firstChunkMs = performance.now() - generationStartedAt;
      reply = prepared.fallbackReply;
      yield reply;
      return;
    }
    try {
      for await (const text of generateChatResponseStream(question, prepared.context, history)) {
        firstChunkMs ??= performance.now() - generationStartedAt;
        reply += text;
        yield text;
      }
    } catch {
      console.warn('Dr. Ai streaming unavailable; using retrieved records.');
      firstChunkMs ??= performance.now() - generationStartedAt;
      reply = prepared.fallbackReply;
      yield reply;
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
