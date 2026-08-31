import { searchSimilarKB } from "../../../repositories/knowledgebase.repository.js";
import { searchSimilarHerbs } from "../../../repositories/herb.repository.js";
import { generateEmbedding, generateChatResponse } from "../core/gemini-service.js";
import type { Content } from "@google/generative-ai";
import type { HerbQueryResult } from "../../../repositories/herb.repository.js";
import type { KBQueryResult } from "../../../repositories/knowledgebase.repository.js";

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

    // Filter out irrelevant results using a cosine distance threshold (lower is closer match)
    const DISTANCE_THRESHOLD = 0.65;
    const relevantKB = rawKB.filter(k => k.distance <= DISTANCE_THRESHOLD);
    const relevantHerbs = rawHerbs.filter(h => h.distance <= DISTANCE_THRESHOLD);

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
