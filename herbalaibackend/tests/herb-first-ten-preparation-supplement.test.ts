import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

const rawReview: unknown = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json", import.meta.url), "utf8"));
const review = z.object({
  queueId: z.string(), status: z.literal("PREPARATION_SUPPLEMENT_NOT_IMPORTABLE"), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()), supersedes: z.string(),
  sources: z.array(z.object({ id: z.string(), url: z.url(), reviewedAt: z.literal("2026-10-05"), limitation: z.string().min(20) })),
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), localName: z.string(), bookEntry: z.number(), printedPage: z.number(),
    preparationPart: z.string().min(5), preparationDescription: z.string().min(40), preparationKind: z.enum(["FOOD_DESCRIPTION", "PREPARATION_METHOD_NOT_ESTABLISHED"]),
    preparationSourceIds: z.array(z.string()).min(1), safetySourceIds: z.array(z.string()), historicalExclusions: z.array(z.string()).min(1),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false), publicationBlockers: z.array(z.string()).min(4),
  })),
}).parse(rawReview);
const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));

describe("first-ten sourced preparation supplement", () => {
  it("preserves the ten first-batch identities and their historical source pointers", () => {
    expect(review.records).toHaveLength(10);
    expect(new Set(review.records.map(record => record.candidateId)).size).toBe(10);
    expect(review.queueId).toBe(queue.batchId);
    for (const candidate of queue.candidates.filter(entry => entry.batch === 1)) {
      expect(review.records.find(entry => entry.candidateId === candidate.id)).toMatchObject({ scientificName: candidate.scientificName, localName: candidate.proposedLocalName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage });
    }
  });

  it("does not invent Talisay preparation details or medical doses", () => {
    const missing = review.records.filter(record => record.preparationKind === "PREPARATION_METHOD_NOT_ESTABLISHED");
    expect(missing).toEqual([expect.objectContaining({ candidateId: "research-pardo-094" })]);
    expect(missing[0].publicationBlockers).toContain("Source a concrete preparation method");
    expect(review.counts).toEqual({ records: 10, foodDescriptions: 9, preparationMethodsNotEstablished: 1, medicinalInstructionsCleared: 0 });
    for (const record of review.records.filter(entry => entry.preparationKind === "FOOD_DESCRIPTION")) expect(record.preparationDescription).toMatch(/not treatment/);
    for (const record of review.records) {
      expect(record.dosage).toBeNull();
      expect(record.preparationInstructions).toBeNull();
    }
  });

  it("retains toxic-part exclusions instead of using food descriptions to clear them", () => {
    const atis = review.records.find(record => record.candidateId === "research-pardo-005");
    expect(atis?.preparationDescription).toMatch(/Seeds must be removed.*toxic/);
    expect(atis?.historicalExclusions.join(" ")).toMatch(/eyes/);
    const chico = review.records.find(record => record.candidateId === "research-pardo-137");
    expect(chico?.preparationDescription).toMatch(/irritating sap.*toxic seed/);
    expect(review.records.find(record => record.candidateId === "research-pardo-102")?.safetySourceIds).toContain("pomegranate-safety");
  });

  it("resolves citations without credentials and does not override publication gates", () => {
    const sourceIds = new Set(review.sources.map(source => source.id));
    expect(sourceIds.size).toBe(review.sources.length);
    for (const source of review.sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe("https:");
      expect(url.username + url.password).toBe("");
    }
    for (const record of review.records) {
      for (const sourceId of [...record.preparationSourceIds, ...record.safetySourceIds]) expect(sourceIds.has(sourceId)).toBe(true);
      expect(record.publicationBlockers).toContain("Fresh all-state duplicate check");
      expect(record.publicationBlockers).toContain("Isolated staging validation");
    }
    expect(rawReview).not.toHaveProperty("herbs");
    expect(review.supersedes).toMatch(/earlier.*review remains unchanged/);
  });
});
