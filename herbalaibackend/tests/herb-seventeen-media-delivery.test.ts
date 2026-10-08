import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const readResearch = (filename: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${filename}`, import.meta.url), "utf8"));
const rawLedger = readResearch("HERB_SEVENTEEN_MEDIA_DELIVERY_2026-10-05.json");
const ledger = z.object({
  status: z.literal("MEDIA_EVIDENCE_NOT_IMPORTABLE"), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()),
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), photoId: z.number(), observationId: z.number(), checkedAt: z.iso.datetime({ offset: true }),
    observationTaxon: z.string(), observationRank: z.literal("species"), observationQuality: z.literal("research"), licenseCodeObserved: z.literal("cc0"),
    sourceUrl: z.url(), sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().positive().max(10485760), width: z.number(), height: z.number(),
    status: z.literal("UPLOADED_DELIVERY_VERIFIED_NOT_PUBLICATION_CLEARANCE"), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
    cloudinaryPublicId: z.string(), cloudinaryAssetId: z.string().regex(/^[a-f0-9]{32}$/), cloudinaryVersion: z.number().positive(),
    cloudinaryUrl: z.url(), cloudinaryCloud: z.literal("dclqw6at7"), cloudinaryFolder: z.literal("herbal_ai_herbs"),
    deliveryHttpStatus: z.literal(200), deliveryContentType: z.enum(["image/jpeg", "image/png"]), deliveryFullDecodePassed: z.literal(true),
    deliveryOriginalSha256Matches: z.literal(true), deliverySha256: z.string(), deliveryBytes: z.number(), deliveryWidth: z.number(), deliveryHeight: z.number(),
    deliveryVerifiedAt: z.iso.datetime({ offset: true }), modification: z.string(),
  })),
}).parse(rawLedger);
const intake = z.object({ photos: z.array(z.object({ candidateId: z.string(), scientificName: z.string(), photoId: z.number(), observationId: z.number(), sha256: z.string().nullable() })) }).parse(readResearch("HERB_REMAINING_THIRTY_DOWNLOAD_INTAKE_2026-10-05.json"));
const visual = z.object({ candidates: z.array(z.object({ candidateId: z.string(), selectedPhotoId: z.number().nullable() })) }).parse(readResearch("HERB_REMAINING_THIRTY_VISUAL_REVIEW_2026-10-05.json"));

describe("seventeen uploaded herb originals", () => {
  it("matches exactly the seventeen selected candidates without duplicate assets", () => {
    expect(ledger.records).toHaveLength(17);
    expect(new Set(ledger.records.map(record => record.photoId)).size).toBe(17);
    expect(new Set(ledger.records.map(record => record.cloudinaryAssetId)).size).toBe(17);
    for (const candidate of visual.candidates.filter(entry => entry.selectedPhotoId !== null)) {
      expect(ledger.records.find(record => record.candidateId === candidate.candidateId)?.photoId).toBe(candidate.selectedPhotoId);
    }
    expect(ledger.records.some(record => record.candidateId === "research-pardo-047")).toBe(false);
  });

  it("retains source hashes, observation identity and freshly checked individual permission", () => {
    for (const record of ledger.records) {
      expect(intake.photos.find(photo => photo.photoId === record.photoId)).toMatchObject({ candidateId: record.candidateId, scientificName: record.scientificName, observationId: record.observationId, sha256: record.sha256 });
      expect(record.observationTaxon).toBe(record.scientificName);
      expect(record.sourceUrl).toBe(`https://www.inaturalist.org/observations/${record.observationId}`);
      expect(record.checkedAt.startsWith("2026-10-05")).toBe(true);
      expect(Date.parse(record.deliveryVerifiedAt)).toBeGreaterThanOrEqual(Date.parse(record.checkedAt));
    }
  });

  it("records exact versioned public originals in the intended Cloudinary account", () => {
    for (const record of ledger.records) {
      const url = new URL(record.cloudinaryUrl);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("res.cloudinary.com");
      expect(url.username + url.password + url.search).toBe("");
      const format = record.deliveryContentType === "image/png" ? "png" : "jpg";
      expect(url.pathname).toBe(`/dclqw6at7/image/upload/v${record.cloudinaryVersion}/${record.cloudinaryPublicId}.${format}`);
      expect(record.cloudinaryPublicId).toContain(`_cc0_${record.photoId}_`);
    }
  });

  it("verifies delivered byte identity, complete decode and original dimensions", () => {
    for (const record of ledger.records) {
      expect(record.deliverySha256).toBe(record.sha256);
      expect(record.deliveryBytes).toBe(record.bytes);
      expect([record.deliveryWidth, record.deliveryHeight]).toEqual([record.width, record.height]);
      expect(Math.max(record.width, record.height)).toBeGreaterThanOrEqual(800);
      expect(Math.min(record.width, record.height)).toBeGreaterThanOrEqual(600);
      expect(record.modification).toMatch(/unchanged/);
    }
  });

  it("counts new uploads separately from twelve pre-existing folder assets", () => {
    expect(ledger.counts).toEqual({ uploaded: 17, deliveryVerified: 17, folderAssetsBefore: 32, folderAssetsAfter: 49, totalExpansionUploads: 37 });
    const earlierPhotos = ["HERB_FIRST_TEN_PHOTOS_2026-10-05.json", "HERB_SECOND_TEN_PHOTO_REVIEW_2026-10-05.json", "HERB_IDENTITY_MEDIA_FOLLOW_UP_2026-10-05.json"]
      .flatMap(filename => z.object({ photos: z.array(z.object({ candidateId: z.string(), photoId: z.number(), cloudinaryUrl: z.string().nullable().optional() })) }).parse(readResearch(filename)).photos)
      .filter(photo => photo.cloudinaryUrl);
    expect(earlierPhotos).toHaveLength(20);
    expect(new Set([...earlierPhotos, ...ledger.records].map(photo => photo.candidateId)).size).toBe(37);
  });

  it("cannot become an import manifest or claim medicinal clearance", () => {
    expect(rawLedger).not.toHaveProperty("herbs");
    for (const record of ledger.records) {
      expect(record).not.toHaveProperty("uploadPath");
      expect(record).not.toHaveProperty("localPath");
    }
  });
});
