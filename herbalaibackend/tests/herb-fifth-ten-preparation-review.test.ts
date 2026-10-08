import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildPreparationPlan } from "../src/content/herb-preparation-update.js";

const readJson = (relative: string): unknown => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const rawReview = readJson("../../Docs/research/HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json");
const review = z.object({
  queueId: z.string(), reviewedAt: z.literal("2026-10-06"), batch: z.literal(5),
  status: z.literal("PREPARATION_RESEARCH_NOT_IMPORTABLE"), productionWritesPerformed: z.literal(false),
  stagingAllowed: z.literal(false), publicationAllowed: z.literal(false), counts: z.record(z.string(), z.number()),
  publicationBlockers: z.array(z.string()).min(4),
  sources: z.array(z.object({
    id: z.string(), scientificName: z.string(), sourceTaxon: z.string().optional(),
    sourceStatus: z.literal("REVIEWED_RESEARCH_ONLY"), kind: z.string(), url: z.url(), retrievalUrl: z.url().optional(),
    supports: z.array(z.enum(["preparationMethod", "foodUse", "warnings"])), reviewCoverage: z.string(), limitation: z.string().min(20),
    downloadBytes: z.number().positive().optional(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  })),
  rejectedSources: z.array(z.object({
    id: z.string(), scientificName: z.string(), sourceStatus: z.literal("QUARANTINED_METADATA_MISMATCH"),
    supports: z.array(z.literal("researchGap")), url: z.url(), reason: z.string(),
    claimedRelatedPmcId: z.string(), linkedArticle: z.object({ title: z.string(), doi: z.string(), matchesOriginalArticle: z.literal(false) }),
    crossrefCheck: z.object({ originalDoi: z.string(), relationEntriesReturned: z.literal(0), limitation: z.string() }),
  })).length(1),
  records: z.array(z.object({
    candidateId: z.string(), localName: z.string(), scientificName: z.string(), bookEntry: z.number(), printedPage: z.number(),
    pdfPage: z.number(), historicalHeading: z.string(), preparationPart: z.string(),
    preparationKind: z.enum(["FOOD_DESCRIPTION", "FOOD_DESCRIPTION_HELD", "REPORTED_FOOD_USE_DESCRIPTION_HELD",
      "TRADITIONAL_DESCRIPTION_HELD", "LABORATORY_DESCRIPTION_HELD", "METHOD_NOT_ESTABLISHED"]),
    preparationDescription: z.string().min(40), preparationSourceIds: z.array(z.string()), foodUseSourceIds: z.array(z.string()),
    gapSourceIds: z.array(z.string()), safetySourceIds: z.array(z.string()), reviewGaps: z.array(z.string()).min(1),
    preparationInstructions: z.null(), dosage: z.null(), medicalReview: z.literal("PENDING"), publicationAllowed: z.literal(false),
  })).length(10),
}).parse(rawReview);
const queue = z.object({ batchId: z.string(), candidates: z.array(z.object({
  id: z.string(), batch: z.number(), proposedLocalName: z.string(), scientificName: z.string(),
  book: z.object({ entry: z.number(), printedPage: z.number(), pdfPage: z.number(), heading: z.string() }),
})) }).parse(readJson("../content/herbs/expansion-batch-03.review.json"));
const getRecord = (candidateId: string) => {
  const record = review.records.find(entry => entry.candidateId === candidateId);
  if (!record) throw new Error(`Missing fifth-ten preparation research: ${candidateId}`);
  return record;
};

describe("fifth-ten source-linked preparation research", () => {
  it("preserves the ten final candidate identities and historical page pointers", () => {
    expect(review.queueId).toBe(queue.batchId);
    const selected = queue.candidates.filter(candidate => candidate.batch === 5);
    expect(review.records.map(record => record.candidateId).sort()).toEqual(selected.map(candidate => candidate.id).sort());
    expect(new Set(review.records.map(record => record.scientificName)).size).toBe(10);
    for (const candidate of selected) expect(getRecord(candidate.id)).toMatchObject({ localName: candidate.proposedLocalName,
      scientificName: candidate.scientificName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage,
      pdfPage: candidate.book.pdfPage, historicalHeading: candidate.book.heading });
  });

  it("covers exactly fifty queue identities across the five research batches, not fifty approved recipes", () => {
    const batchProjection = z.object({ records: z.array(z.object({ candidateId: z.string(), scientificName: z.string(), publicationAllowed: z.literal(false) })) });
    const prior = ["HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json", "HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json",
      "HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json", "HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json"]
      .flatMap(name => batchProjection.parse(readJson(`../../Docs/research/${name}`)).records);
    const combined = [...prior, ...review.records];
    expect(combined).toHaveLength(50);
    expect(new Set(combined.map(record => record.candidateId)).size).toBe(50);
    expect(combined.map(record => record.candidateId).sort()).toEqual(queue.candidates.map(candidate => candidate.id).sort());
    for (const candidate of queue.candidates) expect(combined.find(record => record.candidateId === candidate.id)?.scientificName).toBe(candidate.scientificName);
  });

  it("counts held descriptions, explicit gaps and quarantined evidence honestly", () => {
    const countKind = (kind: typeof review.records[number]["preparationKind"]) => review.records.filter(record => record.preparationKind === kind).length;
    expect(review.counts).toEqual({ records: review.records.length, foodPreparationDescriptions: countKind("FOOD_DESCRIPTION"),
      foodDescriptionsHeld: countKind("FOOD_DESCRIPTION_HELD"), reportedFoodUseDescriptionsHeld: countKind("REPORTED_FOOD_USE_DESCRIPTION_HELD"),
      traditionalDescriptionsHeld: countKind("TRADITIONAL_DESCRIPTION_HELD"), laboratoryDescriptionsHeld: countKind("LABORATORY_DESCRIPTION_HELD"),
      methodsNotEstablished: countKind("METHOD_NOT_ESTABLISHED"), quarantinedSources: review.rejectedSources.length,
      fullySpecifiedHouseholdRecipes: 0, medicinalInstructionsCleared: 0,
      remainingCandidatesWithoutThisPreparationReview: queue.candidates.filter(candidate => candidate.batch > 5).length });
    expect(review.counts.foodPreparationDescriptions).toBe(2);
    for (const record of review.records) {
      expect(record.preparationDescription).toMatch(/not treatment guidance|not a home recipe or treatment|not a complete recipe or treatment guidance/);
      expect(record.preparationDescription).not.toMatch(/cures|safe for pregnancy|daily dose|times per day|\d/);
      expect(record.preparationSourceIds.length > 0).toBe(!["METHOD_NOT_ESTABLISHED", "REPORTED_FOOD_USE_DESCRIPTION_HELD"].includes(record.preparationKind));
    }
  });

  it("keeps the consolidated coverage ledger synchronized with all five batches and the Talisay overlay", () => {
    const coverage = z.object({
      queueId: z.string(), status: z.literal("RESEARCH_COVERAGE_NOT_RELEASE_MANIFEST"),
      productionWritesPerformed: z.literal(false), publicationAllowed: z.literal(false), stagingAllowed: z.literal(false),
      counts: z.record(z.string(), z.number()), methodGapCandidateIds: z.array(z.string()),
      records: z.array(z.object({ candidateId: z.string(), scientificName: z.string(), kind: z.string(),
        sourceFile: z.string(), coverageClass: z.string(), publicationAllowed: z.literal(false) })).length(50),
    }).parse(readJson("../../Docs/research/HERB_FIFTY_PREPARATION_COVERAGE_2026-10-06.json"));
    const overlayFile = "TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json";
    const overlay = z.object({ proposal: z.object({ candidateId: z.string(), preparationKind: z.literal("FOOD_DESCRIPTION") }) })
      .parse(readJson(`../../Docs/research/${overlayFile}`)).proposal;
    const projection = z.object({ records: z.array(z.object({ candidateId: z.string(), scientificName: z.string(), preparationKind: z.string() })) });
    const files = ["HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json", "HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json",
      "HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json", "HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json",
      "HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json"];
    const classes: Record<string, string> = {
      FOOD_DESCRIPTION: "BOUNDED_FOOD_DESCRIPTION", HISTORICAL_DESCRIPTION_WITHHELD: "HELD_TRADITIONAL_DESCRIPTION",
      DRAFT_TRADITIONAL_DESCRIPTION: "HELD_TRADITIONAL_DESCRIPTION", TRADITIONAL_DESCRIPTION_HELD: "HELD_TRADITIONAL_DESCRIPTION",
      REPORTED_FOOD_USE_DESCRIPTION: "HELD_FOOD_OR_REPORTED_FOOD_DESCRIPTION", REPORTED_FOOD_USE_DESCRIPTION_HELD: "HELD_FOOD_OR_REPORTED_FOOD_DESCRIPTION",
      FOOD_DESCRIPTION_HELD: "HELD_FOOD_OR_REPORTED_FOOD_DESCRIPTION", LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD: "HELD_LABORATORY_DESCRIPTION",
      LABORATORY_DESCRIPTION_HELD: "HELD_LABORATORY_DESCRIPTION", MANUFACTURING_DESCRIPTION_HELD: "HELD_MANUFACTURING_DESCRIPTION",
      METHOD_NOT_ESTABLISHED: "METHOD_NOT_ESTABLISHED",
    };
    const expected = files.flatMap(sourceFile => projection.parse(readJson(`../../Docs/research/${sourceFile}`)).records.map(record => {
      const usesOverlay = record.candidateId === overlay.candidateId;
      const kind = usesOverlay ? overlay.preparationKind : record.preparationKind;
      const coverageClass = classes[kind];
      if (!coverageClass) throw new Error(`Unsupported preparation research class: ${kind}`);
      return { candidateId: record.candidateId, scientificName: record.scientificName, kind, coverageClass,
        sourceFile: usesOverlay ? overlayFile : sourceFile, publicationAllowed: false };
    }));
    expect(coverage.queueId).toBe(queue.batchId);
    expect(coverage.records).toEqual(expected);
    const countClass = (classification: string) => expected.filter(record => record.coverageClass === classification).length;
    expect(coverage.counts).toEqual({ reviewedCandidates: expected.length,
      boundedFoodDescriptions: countClass("BOUNDED_FOOD_DESCRIPTION"), heldFoodOrReportedFoodDescriptions: countClass("HELD_FOOD_OR_REPORTED_FOOD_DESCRIPTION"),
      heldTraditionalDescriptions: countClass("HELD_TRADITIONAL_DESCRIPTION"), heldLaboratoryDescriptions: countClass("HELD_LABORATORY_DESCRIPTION"),
      heldManufacturingDescriptions: countClass("HELD_MANUFACTURING_DESCRIPTION"), methodsNotEstablished: countClass("METHOD_NOT_ESTABLISHED"),
      fullySpecifiedHouseholdRecipes: 0, medicinalInstructionsCleared: 0, publicationCleared: 0 });
    expect(coverage.counts.boundedFoodDescriptions).toBe(31);
    expect(coverage.methodGapCandidateIds).toEqual(expected.filter(record => record.coverageClass === "METHOD_NOT_ESTABLISHED").map(record => record.candidateId));
    expect(coverage.methodGapCandidateIds).toHaveLength(4);
    expect(() => buildPreparationPlan(coverage, [], { host: "localhost", database: "herbalai_test" })).toThrow();
  });

  it("requires field-specific, same-species citations and prevents quarantined evidence from becoming a method", () => {
    const sources = new Map(review.sources.map(source => [source.id, source]));
    const rejected = new Map(review.rejectedSources.map(source => [source.id, source]));
    const used = new Set<string>();
    expect(sources.size).toBe(review.sources.length);
    expect([...sources.keys()].some(sourceId => rejected.has(sourceId))).toBe(false);
    for (const record of review.records) {
      for (const [field, ids] of [["preparationMethod", record.preparationSourceIds], ["foodUse", record.foodUseSourceIds],
        ["warnings", record.safetySourceIds]] as const) {
        for (const sourceId of ids) {
          const source = sources.get(sourceId);
          if (!source) throw new Error(`Missing reviewed source: ${sourceId}`);
          expect(rejected.has(sourceId)).toBe(false);
          expect(source.scientificName).toBe(record.scientificName);
          expect(source.supports).toContain(field);
          used.add(sourceId);
        }
      }
      for (const sourceId of record.gapSourceIds) {
        const source = rejected.get(sourceId);
        if (!source) throw new Error(`Missing quarantined source: ${sourceId}`);
        expect(source.scientificName).toBe(record.scientificName);
        expect(source.supports).toEqual(["researchGap"]);
      }
    }
    expect(used.size).toBe(sources.size);
    for (const source of review.sources) {
      for (const address of [source.url, source.retrievalUrl].filter((value): value is string => value !== undefined)) {
        const url = new URL(address);
        expect(url.protocol).toBe("https:");
        expect(url.username + url.password).toBe("");
        expect(["www.nparks.gov.sg", "doi.org", "www.ebi.ac.uk", "prosea.prota4u.org", "www.nccih.nih.gov", "www.botanischetuinen.nl"]).toContain(url.hostname);
      }
      if (source.retrievalUrl) {
        expect(source.reviewCoverage).toContain("FULL_TEXT_XML");
        expect(source.downloadBytes).toBeGreaterThan(1000);
        expect(source.downloadSha256).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("does not erase oxalate kidney injury or claim cooking makes the Averrhoa species safe", () => {
    const bilimbi = getRecord("research-pardo-047");
    expect(bilimbi.preparationKind).toBe("FOOD_DESCRIPTION_HELD");
    expect(bilimbi.safetySourceIds).toEqual(["nair-2014-bilimbi-safety"]);
    expect(bilimbi.preparationDescription).toContain("cooking's effect on toxicity unresolved");
    const carambola = getRecord("research-pardo-048");
    expect(carambola.preparationKind).toBe("FOOD_DESCRIPTION_HELD");
    expect(carambola.safetySourceIds).toEqual(["barman-2016-starfruit-safety"]);
    expect(carambola.reviewGaps.join(" ")).toContain("processing-based detoxification");
  });

  it("retains noni safety uncertainty and keeps cashew apple separate from nut processing", () => {
    const noni = getRecord("research-pardo-126");
    expect(noni.preparationKind).toBe("TRADITIONAL_DESCRIPTION_HELD");
    expect(noni.preparationPart).toContain("Unripe fruit");
    expect(noni.safetySourceIds).toEqual(["nccih-noni-safety"]);
    expect(noni.reviewGaps.join(" ")).toContain("uncertain causation");
    const cashew = getRecord("research-pardo-070");
    expect(cashew.preparationPart).toContain("not nut shell or seed oil");
    expect(cashew.preparationDescription).toContain("does not supply nut-shell processing");
  });

  it("distinguishes bitter-orange food and hybrid notation from concentrated supplements", () => {
    const orange = getRecord("research-pardo-054");
    expect(orange.scientificName).toBe("Citrus aurantium");
    expect(orange.historicalHeading).toBe("Citrus Bigaradia");
    expect(review.sources.find(source => source.id === "nvbt-bitter-orange-food")?.sourceTaxon).toBe("Citrus × aurantium");
    expect(orange.safetySourceIds).toEqual(["nccih-bitter-orange-safety"]);
    expect(orange.reviewGaps.join(" ")).toContain("no causal claim is inferred");
  });

  it("keeps incomplete seasoning reports and essential-oil exclusions explicit", () => {
    const oxalis = getRecord("research-pardo-045");
    expect(oxalis.preparationKind).toBe("REPORTED_FOOD_USE_DESCRIPTION_HELD");
    expect(oxalis.preparationSourceIds).toEqual([]);
    expect(oxalis.safetySourceIds).toEqual(["prosea-oxalis-food-safety"]);
    const kastuli = getRecord("research-pardo-032");
    expect(kastuli.preparationKind).toBe("REPORTED_FOOD_USE_DESCRIPTION_HELD");
    expect(kastuli.preparationSourceIds).toEqual([]);
    expect(kastuli.reviewGaps.join(" ")).toContain("Abelmoschus esculentus");
    expect(kastuli.preparationDescription).toContain("Oil, perfume, incense and tobacco preparation are excluded");
  });

  it("quarantines mismatched retraction metadata without alleging a confirmed retraction", () => {
    const magnolia = getRecord("research-pardo-003");
    expect(magnolia.preparationKind).toBe("METHOD_NOT_ESTABLISHED");
    expect(magnolia.preparationSourceIds).toEqual([]);
    expect(magnolia.gapSourceIds).toEqual(["magnolia-metadata-quarantine"]);
    expect(magnolia.preparationDescription).toContain("not a confirmed retraction finding");
    const rejected = review.rejectedSources[0]!;
    expect(rejected.claimedRelatedPmcId).toBe("PMC11923187");
    expect(rejected.linkedArticle.title).toContain("cinnamon oil");
    expect(rejected.linkedArticle.doi).not.toBe(rejected.crossrefCheck.originalDoi);
    expect(rejected.crossrefCheck.limitation).toContain("does not prove");
  });

  it("keeps laboratory parts and child-safety exclusions outside production imports", () => {
    const abutilon = getRecord("research-pardo-030");
    expect(abutilon.preparationPart).toBe("Combined leaves, twigs and roots in a laboratory extract");
    expect(abutilon.preparationDescription).toContain("freeze-dried");
    const ayapana = getRecord("research-pardo-130");
    expect(ayapana.preparationPart).toContain("leaf/stem mash");
    expect(ayapana.reviewGaps.join(" ")).toContain("newborn feeding");
    expect(rawReview).not.toHaveProperty("herbs");
    expect(() => buildPreparationPlan(rawReview, [], { host: "localhost", database: "herbalai_test" })).toThrow();
    expect(review.publicationBlockers.join(" ")).toMatch(/duplicate.*Species/);
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
