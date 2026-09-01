import { searchSimilarKB } from "../../../repositories/knowledgebase.repository.js";
import { searchSimilarHerbs } from "../../../repositories/herb.repository.js";
import { generateEmbedding, generateChatResponse } from "../core/gemini-service.js";
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

export async function AskAIService(question: string, history: Content[] = []) {
  try {
    // 1. Generate embedding for the question
    const embedding = await generateEmbedding(question);
    const vectorStr = `[${embedding.join(",")}]`;

    // 2. Search for similar context in both repositories in parallel
    const [rawKB, rawHerbs] = await Promise.all([
      searchSimilarKB(vectorStr, 3),
      searchSimilarHerbs(vectorStr, 3)
    ]);

    // Prefer explicit herb-name matches. For FAQ-style questions, a strong lexical
    // KB match suppresses incidental herb matches so citations remain defensible.
    const normalizedQuestion = normalize(question);
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

    // 3. Format combined context
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

    if (!context) {
      context = "No specific knowledge base or verified herb documents found matching this query in the database.";
    }

    // 4. Generate AI response using the dynamic context
    const answer = await generateChatResponse(question, context, history);

    return {
      code: 200,
      status: "success",
      data: {
        answer,
        sources: [
          ...relevantHerbs.map((h: HerbQueryResult) => ({ type: "herb" as const, title: h.localName, distance: h.distance })),
          ...relevantKB.map((k: KBQueryResult) => ({ type: "kb" as const, title: k.question || "FAQ Source", distance: k.distance }))
        ]
      },
    };
  } catch (error) {
    console.error("AskAIService Error:", error);
    return { code: 500, status: "error", message: "Dr. Ai assistant is currently unavailable." };
  }
}
