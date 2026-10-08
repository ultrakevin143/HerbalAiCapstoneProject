import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildPreparationPlan } from "../src/content/herb-preparation-update.js";

const readJson = (relativePath: string): unknown => JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
const rawFollowUp = readJson("../../Docs/research/TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json");
const followUp = z.object({
  status: z.literal("RESEARCH_ONLY_NOT_IMPORTABLE"), queueId: z.string(),
  productionWritesPerformed: z.literal(false), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  supersedesPreparationOnly: z.string(), preservesSafetyReview: z.string(),
  sources: z.array(z.object({
    id: z.string(), kind: z.string(), url: z.url(), pdfUrl: z.url().optional(), reviewCoverage: z.string(),
    printedPagesReviewed: z.array(z.number()), reviewedAt: z.literal("2026-10-05"), downloadBytes: z.number().positive(),
    downloadSha256: z.string().regex(/^[a-f0-9]{64}$/), limitation: z.string().min(20),
  })),
  proposal: z.object({
    candidateId: z.string(), localName: z.string(), scientificName: z.string(), bookEntry: z.number(), printedPage: z.number(),
    preparationPart: z.string(), preparationKind: z.literal("FOOD_DESCRIPTION"), proposedPreparationMethod: z.string(),
    preparationSourceIds: z.array(z.string()), preparationInstructions: z.null(), dosage: z.null(),
    householdRecipeEstablished: z.literal(false), medicinalInstructionsCleared: z.literal(false), publicationAllowed: z.literal(false),
    historicalExclusions: z.array(z.string()), publicationBlockers: z.array(z.string()),
  }),
  effectiveFirstTenPreparationCoverage: z.record(z.string(), z.number()),
}).parse(rawFollowUp);
const baseline = z.object({ queueId: z.string(), records: z.array(z.object({
  candidateId: z.string(), localName: z.string(), scientificName: z.string(), bookEntry: z.number(), printedPage: z.number(),
  preparationKind: z.enum(["FOOD_DESCRIPTION", "PREPARATION_METHOD_NOT_ESTABLISHED"]),
})) }).parse(readJson("../../Docs/research/HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json"));

describe("Talisay source follow-up without publication or invented recipes", () => {
  it("enriches exactly the existing research candidate and preserves the historical checkpoint", () => {
    expect(followUp.queueId).toBe(baseline.queueId);
    const original = baseline.records.find(record => record.candidateId === followUp.proposal.candidateId);
    expect(original).toMatchObject({ candidateId: "research-pardo-094", localName: "Talisay", scientificName: "Terminalia catappa",
      bookEntry: 94, printedPage: 110, preparationKind: "PREPARATION_METHOD_NOT_ESTABLISHED" });
    expect(followUp.proposal).toMatchObject({ candidateId: original!.candidateId, localName: original!.localName,
      scientificName: original!.scientificName, bookEntry: original!.bookEntry, printedPage: original!.printedPage });
    expect(followUp.supersedesPreparationOnly).toBe("Docs/research/HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json");
  });

  it("counts a description overlay once without adding an identity or claiming medicinal clearance", () => {
    const effective = baseline.records.map(record => record.candidateId === followUp.proposal.candidateId
      ? { ...record, preparationKind: followUp.proposal.preparationKind } : record);
    expect(new Set(effective.map(record => record.candidateId)).size).toBe(10);
    expect(followUp.effectiveFirstTenPreparationCoverage).toEqual({ records: effective.length,
      foodDescriptions: effective.filter(record => record.preparationKind === "FOOD_DESCRIPTION").length,
      preparationMethodsNotEstablished: effective.filter(record => record.preparationKind === "PREPARATION_METHOD_NOT_ESTABLISHED").length,
      fullySpecifiedHouseholdRecipesAdded: 0, medicinalInstructionsCleared: 0 });
  });

  it("records the observed processing method without inventing roasting settings or a treatment frequency", () => {
    const method = followUp.proposal.proposedPreparationMethod;
    expect(method).toMatch(/^Food preparation only, not treatment:/);
    expect(method).toContain("one week");
    expect(method).toContain("nutcracker");
    expect(method).toContain("with or without salt");
    expect(method).toContain("no roasting temperature or duration");
    expect(method).not.toMatch(/\d|daily|times per day|cures|safe for pregnancy/i);
    expect(followUp.proposal.preparationPart).toBe("Fruit kernels, not leaf or bark");
  });

  it("resolves primary source sections and download evidence without depending on local raw PDFs", () => {
    const sourceIds = new Set(followUp.sources.map(source => source.id));
    expect(sourceIds.size).toBe(2);
    for (const sourceId of followUp.proposal.preparationSourceIds) expect(sourceIds.has(sourceId)).toBe(true);
    for (const source of followUp.sources) {
      for (const address of [source.url, source.pdfUrl].filter((value): value is string => value !== undefined)) {
        const url = new URL(address);
        expect(url.protocol).toBe("https:");
        expect(url.username + url.password).toBe("");
      }
      expect(source.reviewCoverage).toContain("TEXT_AND_RENDER");
      expect(source.limitation.length).toBeGreaterThan(20);
    }
    expect(followUp.sources.find(source => source.id === "icraf-talisay-food")?.printedPagesReviewed).toEqual([3]);
    expect(followUp.sources.find(source => source.id === "biego-2012-talisay-processing")).toMatchObject({
      kind: "PRIMARY_FOOD_PROCESSING_STUDY", printedPagesReviewed: [2], downloadBytes: 154362,
    });
  });

  it("preserves the unresolved bark-safety review, null doses and publication gates", () => {
    const safety = z.object({ records: z.array(z.object({
      candidateId: z.string(), safetyDraft: z.string(), preparationInstructions: z.null(), dosage: z.null(),
      withheldHistoricalInstructions: z.array(z.string()), publicationBlockers: z.array(z.string()),
    })) }).parse(readJson(`../../${followUp.preservesSafetyReview}`));
    const original = safety.records.find(record => record.candidateId === followUp.proposal.candidateId);
    expect(original?.safetyDraft).toMatch(/bark.*unresolved/);
    expect(original?.withheldHistoricalInstructions).toContain("Bark treatment recipes and historical doses");
    expect(followUp.proposal.publicationBlockers).toEqual(expect.arrayContaining(original!.publicationBlockers));
    expect(followUp.proposal.historicalExclusions.join(" ")).toMatch(/other Terminalia species/);
  });

  it("cannot be passed into the twenty-existing-placeholder writer as an import batch", () => {
    expect(rawFollowUp).not.toHaveProperty("herbs");
    expect(() => buildPreparationPlan(rawFollowUp, [], { host: "localhost", database: "herbalai_test" })).toThrow();
    expect(followUp.proposal.publicationBlockers).toEqual(expect.arrayContaining([
      "Fresh all-state duplicate check", "Plant-part-specific medical review", "Isolated staging validation",
    ]));
  });
});
