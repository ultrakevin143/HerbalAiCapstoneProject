import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildPreparationPlan } from "../src/content/herb-preparation-update.js";

const readJson = (relative: string): unknown => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const rawReview = readJson("../../Docs/research/HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json");
const review = z.object({
  queueId: z.string(), status: z.literal("PREPARATION_RESEARCH_NOT_IMPORTABLE"), batch: z.literal(4),
  productionWritesPerformed: z.literal(false), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()), publicationBlockers: z.array(z.string()).min(4),
  sources: z.array(z.object({
    id: z.string(), scientificName: z.string().nullable(), taxonScope: z.enum(["EXACT_SPECIES", "GENUS_ONLY"]),
    kind: z.string(), url: z.url(), retrievalUrl: z.url().optional(),
    supports: z.array(z.enum(["preparationMethod", "foodUse", "researchGap", "warnings"])),
    reviewCoverage: z.string(), limitation: z.string().min(20),
    downloadBytes: z.number().positive().optional(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  })),
  records: z.array(z.object({
    candidateId: z.string(), localName: z.string(), scientificName: z.string(), bookEntry: z.number(),
    printedPage: z.number(), pdfPage: z.number(), historicalHeading: z.string(), preparationPart: z.string(),
    preparationKind: z.enum(["FOOD_DESCRIPTION", "MANUFACTURING_DESCRIPTION_HELD", "LABORATORY_DESCRIPTION_HELD", "METHOD_NOT_ESTABLISHED"]),
    preparationDescription: z.string().min(40), preparationSourceIds: z.array(z.string()),
    foodUseSourceIds: z.array(z.string()), gapSourceIds: z.array(z.string()), safetySourceIds: z.array(z.string()),
    reviewGaps: z.array(z.string()).min(1), preparationInstructions: z.null(), dosage: z.null(),
    medicalReview: z.literal("PENDING"), publicationAllowed: z.literal(false),
  })).length(10),
}).parse(rawReview);
const queue = z.object({ batchId: z.string(), candidates: z.array(z.object({
  id: z.string(), batch: z.number(), proposedLocalName: z.string(), scientificName: z.string(),
  book: z.object({ entry: z.number(), printedPage: z.number(), pdfPage: z.number(), heading: z.string() }),
})) }).parse(readJson("../content/herbs/expansion-batch-03.review.json"));
const getRecord = (candidateId: string) => {
  const record = review.records.find(entry => entry.candidateId === candidateId);
  if (!record) throw new Error(`Missing fourth-ten preparation research: ${candidateId}`);
  return record;
};

describe("fourth-ten source-linked preparation research", () => {
  it("preserves every fourth-batch identity and historical page pointer without a duplicate", () => {
    expect(review.queueId).toBe(queue.batchId);
    const selected = queue.candidates.filter(candidate => candidate.batch === 4);
    expect(review.records.map(record => record.candidateId).sort()).toEqual(selected.map(candidate => candidate.id).sort());
    expect(new Set(review.records.map(record => record.scientificName)).size).toBe(10);
    for (const candidate of selected) expect(getRecord(candidate.id)).toMatchObject({ localName: candidate.proposedLocalName,
      scientificName: candidate.scientificName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage,
      pdfPage: candidate.book.pdfPage, historicalHeading: candidate.book.heading });
  });

  it("counts explicit gaps and held experiments separately from food preparation", () => {
    expect(review.counts).toEqual({ records: review.records.length,
      foodPreparationDescriptions: review.records.filter(record => record.preparationKind === "FOOD_DESCRIPTION").length,
      manufacturingDescriptionsHeld: review.records.filter(record => record.preparationKind === "MANUFACTURING_DESCRIPTION_HELD").length,
      laboratoryDescriptionsHeld: review.records.filter(record => record.preparationKind === "LABORATORY_DESCRIPTION_HELD").length,
      methodsNotEstablished: review.records.filter(record => record.preparationKind === "METHOD_NOT_ESTABLISHED").length,
      fullySpecifiedHouseholdRecipes: 0, medicinalInstructionsCleared: 0,
      remainingCandidatesWithoutThisPreparationReview: queue.candidates.filter(candidate => candidate.batch > 4).length });
    expect(review.counts.foodPreparationDescriptions).toBe(4);
    expect(review.counts.methodsNotEstablished).toBe(3);
    for (const record of review.records) {
      expect(record.preparationDescription).toMatch(/not treatment guidance|not a home recipe or treatment/);
      expect(record.preparationDescription).not.toMatch(/cures|safe for pregnancy|daily dose|times per day|\d/);
      expect(record.preparationSourceIds.length > 0).toBe(record.preparationKind !== "METHOD_NOT_ESTABLISHED");
    }
  });

  it("only links species-matched evidence to fields it actually supports", () => {
    const sources = new Map(review.sources.map(source => [source.id, source]));
    const referenced = new Set<string>();
    expect(sources.size).toBe(review.sources.length);
    for (const record of review.records) {
      for (const [field, ids] of [["preparationMethod", record.preparationSourceIds], ["foodUse", record.foodUseSourceIds],
        ["researchGap", record.gapSourceIds], ["warnings", record.safetySourceIds]] as const) {
        for (const sourceId of ids) {
          const source = sources.get(sourceId);
          if (!source) throw new Error(`Missing preparation source: ${sourceId}`);
          referenced.add(sourceId);
          expect(source.supports).toContain(field);
          if (source.taxonScope === "GENUS_ONLY") {
            expect(field).toBe("researchGap");
            expect(record.candidateId).toBe("research-pardo-124");
            expect(source.scientificName).toBeNull();
          } else expect(source.scientificName).toBe(record.scientificName);
        }
      }
    }
    expect(referenced.size).toBe(sources.size);
    for (const source of review.sources) {
      for (const address of [source.url, source.retrievalUrl].filter((value): value is string => value !== undefined)) {
        const url = new URL(address);
        expect(url.protocol).toBe("https:");
        expect(url.username + url.password).toBe("");
        expect(["www.nparks.gov.sg", "doi.org", "www.ebi.ac.uk", "apps.worldagroforestry.org", "prota.prota4u.org"]).toContain(url.hostname);
      }
      if (source.retrievalUrl) {
        expect(source.reviewCoverage).toContain("FULL_TEXT_XML");
        expect(source.downloadBytes).toBeGreaterThan(1000);
        expect(source.downloadSha256).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("does not turn a genus lead or an edible-part label into an exact-species recipe", () => {
    const santan = getRecord("research-pardo-124");
    expect(santan.preparationSourceIds).toEqual([]);
    expect(santan.gapSourceIds).toEqual(["nparks-ixora-genus-lead"]);
    expect(santan.reviewGaps.join(" ")).toContain("genus-only tempura lead");
    expect(getRecord("research-pardo-138").preparationDescription).toContain("supplies no preparation process");
    expect(getRecord("research-pardo-033").reviewGaps.join(" ")).toMatch(/Hibiscus sabdariffa.*Thespesia populnea/);
  });

  it("keeps jasmine tea scenting separate from household flower infusion", () => {
    const jasmine = getRecord("research-pardo-139");
    expect(jasmine.preparationKind).toBe("MANUFACTURING_DESCRIPTION_HELD");
    expect(jasmine.preparationPart).toContain("cv. bifoliatum");
    expect(jasmine.preparationPart).toContain("Camellia sinensis");
    expect(jasmine.preparationDescription).toContain("separated spent flowers");
    expect(jasmine.reviewGaps.join(" ")).toContain("boiling arbitrary ornamental jasmine");
  });

  it("preserves Ceiba's seed-oil caution and limits coffee to its seeds", () => {
    const ceiba = getRecord("research-pardo-038");
    expect(ceiba.historicalHeading).toBe("Eriodendron anfractuosum");
    expect(ceiba.safetySourceIds).toEqual(["prota-ceiba-food-safety"]);
    expect(ceiba.preparationDescription).toContain("seed and oil preparations are excluded");
    expect(ceiba.reviewGaps.join(" ")).toContain("older World Agroforestry cooking-oil mention");
    expect(getRecord("research-pardo-035").preparationPart).toBe("Young flower buds and leaves");
    expect(getRecord("research-pardo-125").preparationPart).toContain("not leaves");
  });

  it("retains laboratory and historical-name boundaries without human dosing", () => {
    const kalumpang = getRecord("research-pardo-039");
    expect(kalumpang.preparationKind).toBe("LABORATORY_DESCRIPTION_HELD");
    expect(kalumpang.preparationDescription).toContain("methanol");
    expect(kalumpang.reviewGaps.join(" ")).toContain("animal assay doses");
    const asana = getRecord("research-pardo-079");
    expect(asana.preparationKind).toBe("LABORATORY_DESCRIPTION_HELD");
    expect(asana.reviewGaps.join(" ")).toMatch(/Pterocarpus marsupium.*Pterocarpus angolensis.*Sphaeranthus indicus/);
    const manzanitas = getRecord("research-pardo-067");
    expect(manzanitas.scientificName).toBe("Ziziphus mauritiana");
    expect(manzanitas.historicalHeading).toBe("Zizyphus Jujuba, Lam.");
    expect(manzanitas.reviewGaps.join(" ")).toContain("modern Ziziphus jujuba");
  });

  it("remains non-importable without changing production fields, media or publication gates", () => {
    expect(rawReview).not.toHaveProperty("herbs");
    expect(() => buildPreparationPlan(rawReview, [], { host: "localhost", database: "herbalai_test" })).toThrow();
    expect(review.publicationBlockers.join(" ")).toContain("duplicate");
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
