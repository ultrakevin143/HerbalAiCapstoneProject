import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

const rawReview: unknown = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json", import.meta.url), "utf8"));
const review = z.object({
  queueId: z.string(), status: z.literal("EVIDENCE_REVIEW_NOT_IMPORTABLE"), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()), limitations: z.array(z.string()),
  sources: z.array(z.object({ id: z.string(), kind: z.string(), url: z.url(), reviewedAt: z.literal("2026-10-05"), limitation: z.string().min(20) })),
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), localName: z.string(), bookEntry: z.number(), printedPage: z.number(), pdfPage: z.number(),
    preparationKind: z.enum(["FOOD_DESCRIPTION", "HISTORICAL_DESCRIPTION_WITHHELD", "DRAFT_TRADITIONAL_DESCRIPTION"]),
    preparationPart: z.string().min(5), preparationDescription: z.string().min(40), preparationSourceIds: z.array(z.string()).min(1),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false), publicationBlockers: z.array(z.string()).min(5),
    historicalExclusions: z.array(z.string()).min(1), identityNotes: z.string().min(20), safetyNotes: z.string().min(20),
    identitySourceIds: z.array(z.string()).optional(), safetySourceIds: z.array(z.string()).optional(),
  })),
}).parse(rawReview);
const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const findRecord = (candidateId: string) => {
  const record = review.records.find(entry => entry.candidateId === candidateId);
  if (!record) throw new Error(`Missing reviewed candidate ${candidateId}`);
  return record;
};

describe("second-ten preparation evidence boundaries", () => {
  it("covers exactly the second batch with unchanged queue names and book pointers", () => {
    expect(review.queueId).toBe(queue.batchId);
    expect(review.records).toHaveLength(10);
    expect(new Set(review.records.map(record => record.candidateId)).size).toBe(10);
    for (const candidate of queue.candidates.filter(entry => entry.batch === 2)) {
      expect(findRecord(candidate.id)).toMatchObject({ scientificName: candidate.scientificName, localName: candidate.proposedLocalName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage, pdfPage: candidate.book.pdfPage });
    }
  });

  it("resolves each field citation to a reviewed public source without credentials", () => {
    const sourceIds = new Set(review.sources.map(source => source.id));
    expect(sourceIds.size).toBe(review.sources.length);
    for (const source of review.sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe("https:");
      expect(url.username + url.password).toBe("");
    }
    for (const record of review.records) {
      for (const sourceId of [...record.preparationSourceIds, ...(record.identitySourceIds ?? []), ...(record.safetySourceIds ?? [])]) expect(sourceIds.has(sourceId)).toBe(true);
    }
  });

  it("separates seven food descriptions from three held medicinal descriptions", () => {
    expect(review.records.filter(record => record.preparationKind === "FOOD_DESCRIPTION")).toHaveLength(7);
    expect(review.records.filter(record => record.preparationKind !== "FOOD_DESCRIPTION")).toHaveLength(3);
    expect(review.counts).toEqual({ records: 10, foodPreparationDescriptions: 7, traditionalDescriptionsHeld: 3, medicinalInstructionsCleared: 0 });
    for (const record of review.records.filter(entry => entry.preparationKind === "FOOD_DESCRIPTION")) {
      expect(record.preparationDescription).toMatch(/not treatment/i);
      expect(record.preparationSourceIds).not.toContain("pardo-1901");
    }
  });

  it("keeps draft monograph status and corn silk separate from tassels", () => {
    const maize = findRecord("research-pardo-217");
    expect(maize.preparationPart).toMatch(/stigma.*not tassel/);
    expect(maize.preparationKind).toBe("DRAFT_TRADITIONAL_DESCRIPTION");
    expect(maize.preparationDescription).toMatch(/draft EMA.*not well-established/i);
    expect(maize.preparationSourceIds).toContain("maize-ema-status");
    expect(maize.safetyNotes).toMatch(/pregnancy.*fluid intake/);
    expect(review.sources.find(source => source.id === "maize-ema-draft")?.kind).toBe("DRAFT_REGULATORY_MONOGRAPH");
  });

  it("does not invent recipes from unavailable sources or neighbouring plant paragraphs", () => {
    expect(review.limitations.join(" ")).toMatch(/HTTP 429.*not a read monograph/);
    expect(findRecord("research-pardo-119").publicationBlockers).toContain("Full current fennel monograph and safety review");
    expect(findRecord("research-pardo-014").historicalExclusions.join(" ")).toMatch(/do not borrow Cleome/);
    expect(findRecord("research-pardo-015").preparationDescription).toMatch(/taproot.*soups/);
    expect(findRecord("research-pardo-020").historicalExclusions.join(" ")).toMatch(/eyewash.*coughing blood/);
    expect(findRecord("research-pardo-159").safetySourceIds).toContain("sesame-fda");
    expect(findRecord("research-pardo-184").historicalExclusions.join(" ")).toMatch(/malaria.*piperine/);
  });

  it("cannot be imported and cannot erase release or duplicate-check holds", () => {
    expect(rawReview).not.toHaveProperty("herbs");
    for (const record of review.records) {
      expect(record.publicationBlockers).toContain("Confirm intended live Neon target");
      expect(record.publicationBlockers).toContain("Fresh all-state duplicate check");
      expect(record.publicationBlockers).toContain("Isolated staging validation");
      expect(record.dosage).toBeNull();
      expect(record.preparationInstructions).toBeNull();
    }
    expect(findRecord("research-pardo-219").publicationBlockers).toContain("Species-versus-commercial-hybrid reconciliation");
  });
});
