import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const queue = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8"));
const review = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_FIRST_TEN_REVIEW_2026-10-05.json", import.meta.url), "utf8"));
const photoLeads = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_FIRST_TEN_PHOTOS_2026-10-05.json", import.meta.url), "utf8"));

describe("first-ten educational content review contract", () => {
  it("is deliberately incompatible with the production import format", () => {
    expect(review.status).toBe("EVIDENCE_REVIEW_NOT_IMPORTABLE");
    expect(review.publicationAllowed).toBe(false);
    expect(review.stagingAllowed).toBe(false);
    expect(review.herbs).toBeUndefined();
    expect(review.queueId).toBe(queue.batchId);
    expect(review.duplicateCheck.freshCheckRequired).toBe(true);
  });

  it("covers exactly the first ten queue identities without replacing any of them", () => {
    const firstBatch = queue.candidates.filter((candidate: { batch: number }) => candidate.batch === 1);
    expect(review.records).toHaveLength(10);
    expect(new Set(review.records.map((record: { candidateId: string }) => record.candidateId)).size).toBe(10);
    for (const candidate of firstBatch) {
      const record = review.records.find((entry: { candidateId: string }) => entry.candidateId === candidate.id);
      expect(record).toMatchObject({ scientificName: candidate.scientificName, localName: candidate.proposedLocalName, bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage });
    }
  });

  it("keeps all dose and preparation instructions withheld with explicit remaining gates", () => {
    for (const record of review.records) {
      expect(record.dosage).toBeNull();
      expect(record.preparationInstructions).toBeNull();
      expect(record.withheldHistoricalInstructions.length).toBeGreaterThan(0);
      expect(record.publicationBlockers).toContain("Fresh all-state duplicate check");
      expect(record.publicationBlockers).toContain("Isolated staging validation");
      expect(record.publicationBlockers.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves every cited field to a source with a public URL and explicit limitations", () => {
    const sources = new Map(review.sources.map((source: { id: string }) => [source.id, source]));
    expect(sources.size).toBe(review.sources.length);
    for (const source of review.sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe("https:");
      expect(url.username + url.password).toBe("");
      expect(source.limitation.length).toBeGreaterThan(20);
    }
    for (const record of review.records) {
      expect(record.traditionalSourceIds.length).toBeGreaterThan(0);
      for (const field of ["traditionalSourceIds", "modernSourceIds", "safetySourceIds"] as const) {
        for (const sourceId of record[field]) expect(sources.has(sourceId)).toBe(true);
      }
    }
  });

  it("does not turn local-use reports or animal experiments into human treatment proof", () => {
    const papaya = review.records.find((record: { scientificName: string }) => record.scientificName === "Carica papaya");
    expect(papaya.modernEvidenceDraft).toMatch(/rat.*not.*human/i);
    expect(papaya.traditionalUseDraft).toMatch(/not clinical proof/i);
    const traditional = review.sources.find((source: { id: string }) => source.id === "dapar-2020");
    expect(traditional.kind).toBe("PHILIPPINE_ETHNOBOTANY");
    expect(traditional.limitation).toMatch(/not a clinical success rate/);
    const duhat = review.records.find((record: { scientificName: string }) => record.scientificName === "Syzygium cumini");
    expect(duhat.modernEvidenceDraft).toMatch(/did not reduce fasting glucose/);
  });

  it("retains high-risk part-specific cautions rather than old book recipes", () => {
    const expectedWarnings = new Map([
      ["Annona squamosa", /seed.*eyes/i],
      ["Clitoria ternatea", /root.*seed/i],
      ["Sandoricum koetjape", /not recommend swallowing.*seeds/i],
      ["Carica papaya", /latex.*child/i],
      ["Punica granatum", /root.*stem.*peel/i],
      ["Manilkara zapota", /withhold.*seed/i],
    ]);
    for (const [scientificName, warning] of expectedWarnings) {
      const record = review.records.find((entry: { scientificName: string }) => entry.scientificName === scientificName);
      expect(record.safetyDraft).toMatch(warning);
    }
  });

  it("resolves the three local occurrence gaps with botanical rather than medicinal sources", () => {
    const pending = review.records.filter((record: { identity: { philippineOccurrence: string } }) => record.identity.philippineOccurrence === "MODERN_LOCAL_SOURCE_PENDING");
    expect(pending).toEqual([]);
    for (const localName of ["Sampalok", "Granada", "Chico"]) {
      const record = review.records.find((entry: { localName: string }) => entry.localName === localName);
      const source = review.sources.find((entry: { id: string }) => entry.id === record.identity.occurrenceSourceId);
      expect(source.kind).toBe("PHILIPPINE_BOTANICAL_OCCURRENCE");
      expect(source.url).toBe(record.identity.occurrenceSourceUrl);
      expect(record.publicationBlockers).not.toContain("Modern Philippine occurrence source");
    }
    const duhat = review.records.find((record: { localName: string }) => record.localName === "Duhat");
    expect(duhat.identity.note).toMatch(/Eugenia jambolana.*heterotypic synonym/);
    expect(duhat.publicationBlockers).not.toContain("Historical synonym confirmation");
  });

  it("selects only individually licensed, decoded, visually checked photo leads", () => {
    const selected = review.records.filter((record: { photoReview: unknown }) => record.photoReview !== null);
    expect(selected).toHaveLength(10);
    for (const record of selected) {
      const photo = record.photoReview;
      const lead = photoLeads.photos.find((entry: { photoId: number }) => entry.photoId === photo.photoId);
      expect(lead).toMatchObject({ candidateId: record.candidateId, scientificName: record.scientificName, observationId: photo.observationId, license: "CC0 1.0", assetUrl: photo.assetUrl });
      expect(photo.observationTaxon).toBe(record.scientificName);
      expect(photo.licenseCodeObserved).toBe("cc0");
      expect(photo.fullDecodePassed).toBe(true);
      expect(Math.max(photo.width, photo.height)).toBeGreaterThanOrEqual(800);
      expect(Math.min(photo.width, photo.height)).toBeGreaterThanOrEqual(600);
      expect(photo.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(photo.status).toBe("VISUALLY_CONSISTENT_NOT_PUBLICATION_CLEARANCE");
      expect(review.sources.find((source: { id: string }) => source.id === photo.morphologySourceId)?.kind).toBe("BOTANICAL_DESCRIPTION");
      const url = new URL(photo.cloudinaryUrl);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("res.cloudinary.com");
      expect(url.username + url.password).toBe("");
      expect(url.pathname).toMatch(/^\/dclqw6at7\/image\/upload\/v\d+\//);
      expect(url.pathname.endsWith(`/${photo.cloudinaryPublicId}.jpg`)).toBe(true);
      expect(photo.cloudinaryAssetId).toMatch(/^[a-f0-9]{32}$/);
      expect(photo.cloudinaryFolder).toBe("herbal_ai_herbs");
      expect(photo.deliveryHttpStatus).toBe(200);
      expect(photo.deliveryOriginalSha256Matches).toBe(true);
      expect(photo.deliveryVerifiedAt).toBe("2026-10-05");
    }
  });

  it("retains rejected photo decisions without editing watermarks or accepting an undersized derivative", () => {
    expect(photoLeads.notSelected.find((photo: { photoId: number }) => photo.photoId === 370605496)?.reason).toMatch(/watermark/);
    expect(photoLeads.notSelected.find((photo: { photoId: number }) => photo.photoId === 543893850)?.reason).toMatch(/watermark/);
    expect(photoLeads.notSelected.find((photo: { photoId: number }) => photo.photoId === 559963774)?.reason).toMatch(/600/);
    for (const decision of photoLeads.notSelected) {
      expect(photoLeads.photos.some((photo: { photoId: number }) => photo.photoId === decision.photoId)).toBe(false);
    }
  });
});
