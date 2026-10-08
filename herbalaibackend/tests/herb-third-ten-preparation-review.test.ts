import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildPreparationPlan } from "../src/content/herb-preparation-update.js";

const readJson = (relative: string): unknown => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const rawReview = readJson("../../Docs/research/HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json");
const review = z.object({
  queueId: z.string(), status: z.literal("PREPARATION_RESEARCH_NOT_IMPORTABLE"), batch: z.literal(3),
  productionWritesPerformed: z.literal(false), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()), publicationBlockers: z.array(z.string()).min(4),
  sources: z.array(z.object({
    id: z.string(), scientificName: z.string(), kind: z.string(), url: z.url(), retrievalUrl: z.url().optional(),
    supports: z.array(z.enum(["preparationMethod", "warnings"])), reviewCoverage: z.string(), limitation: z.string().min(20),
    downloadBytes: z.number().positive().optional(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  })),
  records: z.array(z.object({
    candidateId: z.string(), localName: z.string(), scientificName: z.string(), bookEntry: z.number(), printedPage: z.number(), historicalHeading: z.string(),
    preparationPart: z.string(), preparationKind: z.enum(["FOOD_DESCRIPTION", "REPORTED_FOOD_USE_DESCRIPTION", "LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD"]),
    preparationDescription: z.string().min(40), preparationSourceIds: z.array(z.string()).min(1), safetySourceIds: z.array(z.string()), reviewGaps: z.array(z.string()).min(1),
    preparationInstructions: z.null(), dosage: z.null(), medicalReview: z.literal("PENDING"), publicationAllowed: z.literal(false),
  })).length(10),
}).parse(rawReview);
const queue = z.object({ batchId: z.string(), candidates: z.array(z.object({
  id: z.string(), batch: z.number(), proposedLocalName: z.string(), scientificName: z.string(),
  book: z.object({ entry: z.number(), printedPage: z.number(), heading: z.string() }),
})) }).parse(readJson("../content/herbs/expansion-batch-03.review.json"));
const getRecord = (candidateId: string) => {
  const record = review.records.find(entry => entry.candidateId === candidateId);
  if (!record) throw new Error(`Missing third-ten preparation research: ${candidateId}`);
  return record;
};

describe("third-ten source-linked preparation research", () => {
  it("preserves exactly the ten third-batch identities and historical headings without adding a duplicate", () => {
    expect(review.queueId).toBe(queue.batchId);
    const selected = queue.candidates.filter(candidate => candidate.batch === 3);
    expect(review.records.map(record => record.candidateId).sort()).toEqual(selected.map(candidate => candidate.id).sort());
    expect(new Set(review.records.map(record => record.scientificName)).size).toBe(10);
    for (const candidate of selected) expect(getRecord(candidate.id)).toMatchObject({ localName: candidate.proposedLocalName,
      scientificName: candidate.scientificName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage, historicalHeading: candidate.book.heading });
  });

  it("counts culinary descriptions, background reporting and laboratory processing separately", () => {
    expect(review.counts).toEqual({ records: review.records.length,
      foodPreparationDescriptions: review.records.filter(record => record.preparationKind === "FOOD_DESCRIPTION").length,
      reportedFoodUseDescriptions: review.records.filter(record => record.preparationKind === "REPORTED_FOOD_USE_DESCRIPTION").length,
      laboratoryFoodProcessingDescriptionsHeld: review.records.filter(record => record.preparationKind === "LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD").length,
      fullySpecifiedHouseholdRecipes: 0, medicinalInstructionsCleared: 0,
      remainingCandidatesWithoutThisPreparationReview: queue.candidates.filter(candidate => candidate.batch > 3).length });
    expect(review.counts.foodPreparationDescriptions).toBe(8);
    for (const record of review.records) {
      expect(record.preparationDescription).toMatch(/not treatment|not a home recipe or treatment/);
      expect(record.preparationDescription).not.toMatch(/cures|safe for pregnancy|times per day|daily dose/i);
    }
  });

  it("links every preparation and safety citation to the same species and an explicitly supported field", () => {
    const sources = new Map(review.sources.map(source => [source.id, source]));
    expect(sources.size).toBe(review.sources.length);
    for (const record of review.records) {
      for (const [field, ids] of [["preparationMethod", record.preparationSourceIds], ["warnings", record.safetySourceIds]] as const) {
        for (const sourceId of ids) {
          const source = sources.get(sourceId);
          expect(source).toBeDefined();
          expect(source!.scientificName).toBe(record.scientificName);
          expect(source!.supports).toContain(field);
        }
      }
    }
    for (const source of review.sources) {
      for (const address of [source.url, source.retrievalUrl].filter((value): value is string => value !== undefined)) {
        const url = new URL(address);
        expect(url.protocol).toBe("https:");
        expect(url.username + url.password).toBe("");
        expect(url.hostname).not.toMatch(/(?:facebook|reddit)\.com$/);
      }
      if (source.retrievalUrl) {
        expect(source.reviewCoverage).toContain("FULL_TEXT_XML");
        expect(source.downloadBytes).toBeGreaterThan(1000);
        expect(source.downloadSha256).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("keeps the three basil species and rosemary's historical name separate", () => {
    expect(getRecord("research-pardo-170").preparationDescription).toContain("pesto");
    expect(getRecord("research-pardo-171").preparationKind).toBe("REPORTED_FOOD_USE_DESCRIPTION");
    expect(getRecord("research-pardo-172")).toMatchObject({ scientificName: "Ocimum tenuiflorum", historicalHeading: "Ocimum sanctum" });
    expect(getRecord("research-pardo-174")).toMatchObject({ scientificName: "Salvia rosmarinus", historicalHeading: "Rosmarinus officinalis" });
    expect(getRecord("research-pardo-174").reviewGaps.join(" ")).toMatch(/pregnant.*breastfeeding.*essential oil/);
  });

  it("retains the exact flower, leaf and seed food parts without inventing quantities", () => {
    const katuray = getRecord("research-pardo-073");
    expect(katuray.preparationPart).toBe("Unopened white flowers");
    expect(katuray.preparationDescription).toContain("stamen and calyx removed");
    expect(katuray.preparationDescription).toContain("soups and stews");
    expect(getRecord("research-pardo-089").preparationPart).toBe("Young leaves, not seeds or bark");
    expect(getRecord("research-pardo-215").preparationDescription).toContain("boiled in sugar syrup");
    for (const record of review.records.filter(record => record.preparationKind === "FOOD_DESCRIPTION")) expect(record.preparationDescription).not.toMatch(/\d/);
  });

  it("keeps Kupang's actual study soaking time without inventing the missing cooking time or a household protocol", () => {
    const kupang = getRecord("research-pardo-091");
    expect(kupang.preparationKind).toBe("LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD");
    expect(kupang.preparationDescription).toContain("12 hours");
    expect(kupang.preparationDescription).toContain("freeze-drying");
    expect(kupang.preparationDescription).toContain("does not specify the numeric cooking time");
    expect(kupang.reviewGaps.join(" ")).toMatch(/Parkia speciosa.*Parkia biglobosa/);
    expect(kupang.preparationInstructions).toBeNull();
  });

  it("keeps bottle-gourd toxicity and mature-loofah exclusions attached to the right species", () => {
    const gourd = getRecord("research-pardo-108");
    expect(gourd.safetySourceIds).toContain("icmr-2012-bottle-gourd-safety");
    expect(gourd.preparationDescription).toContain("Discard bitter fruit");
    expect(gourd.preparationDescription).toContain("do not consume bitter juice");
    expect(gourd.reviewGaps.join(" ")).toContain("urgent medical attention");
    const loofah = getRecord("research-pardo-112");
    expect(loofah.safetySourceIds).toEqual(["nparks-smooth-loofah-safety"]);
    expect(loofah.preparationPart).toBe("Immature edible fruit, not mature sponge");
    expect(loofah.preparationDescription).toContain("must not be generalized");
    expect(loofah.reviewGaps.join(" ")).toContain("bitter and inedible");
  });

  it("remains outside imports and retains every live publication gate", () => {
    expect(rawReview).not.toHaveProperty("herbs");
    expect(() => buildPreparationPlan(rawReview, [], { host: "localhost", database: "herbalai_test" })).toThrow();
    expect(review.publicationBlockers.join(" ")).toMatch(/duplicate.*species|duplicate.*Species/);
    expect(review.publicationBlockers.join(" ")).toContain("PostgreSQL");
    for (const record of review.records) {
      expect(record).not.toHaveProperty("imageUrl");
      expect(record.preparationInstructions).toBeNull();
      expect(record.dosage).toBeNull();
      expect(record.medicalReview).toBe("PENDING");
      expect(record.publicationAllowed).toBe(false);
    }
  });
});
