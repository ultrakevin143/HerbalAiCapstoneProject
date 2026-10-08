import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

const readResearch = (filename: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${filename}`, import.meta.url), "utf8"));
const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const review = z.object({
  status: z.literal("PRELIMINARY_VISUAL_REVIEW_NOT_IMPORTABLE"),
  uploadAllowed: z.literal(false),
  stagingAllowed: z.literal(false),
  publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()),
  limitations: z.array(z.string()),
  candidates: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), localName: z.string(), selectedPhotoId: z.number().nullable(),
    status: z.enum(["PROVISIONAL_COVER_PENDING_FINAL_CHECKS", "REPLACEMENT_COVER_NEEDED", "NO_DOWNLOADED_LEAD"]),
    observed: z.string().min(20), comparisonSourceUrls: z.array(z.url()), publicationAllowed: z.literal(false),
  })),
  photos: z.array(z.object({
    photoId: z.number(), candidateId: z.string(), sourceSha256: z.string().nullable(), visuallyInspected: z.boolean(),
    status: z.enum(["PROVISIONAL_COVER", "SUPPORTING_ONLY", "REJECTED_AS_COVER", "NOT_VIEWED_SIZE_REJECTED"]),
    observed: z.string().min(20), cloudinaryUrl: z.null(), uploadAllowed: z.literal(false),
  })),
}).parse(readResearch("HERB_REMAINING_THIRTY_VISUAL_REVIEW_2026-10-05.json"));
const intake = z.object({
  candidates: z.array(z.object({ candidateId: z.string(), photoIds: z.array(z.number()) })),
  photos: z.array(z.object({ photoId: z.number(), candidateId: z.string(), sha256: z.string().nullable(), sizeGatePassed: z.boolean() })),
}).parse(readResearch("HERB_REMAINING_THIRTY_DOWNLOAD_INTAKE_2026-10-05.json"));

describe("remaining-thirty preliminary visual review", () => {
  it("retains all thirty queue identities without introducing lookalike substitutes", () => {
    expect(review.candidates).toHaveLength(30);
    expect(new Set(review.candidates.map(candidate => candidate.candidateId)).size).toBe(30);
    for (const candidate of queue.candidates.filter(entry => entry.batch > 2)) {
      expect(review.candidates.find(entry => entry.candidateId === candidate.id)).toMatchObject({ scientificName: candidate.scientificName, localName: candidate.proposedLocalName });
    }
  });

  it("reconciles every review with the original intake and unchanged source hash", () => {
    expect(review.photos).toHaveLength(51);
    expect(new Set(review.photos.map(photo => photo.photoId)).size).toBe(51);
    for (const original of intake.photos) {
      expect(review.photos.find(photo => photo.photoId === original.photoId)).toMatchObject({ candidateId: original.candidateId, sourceSha256: original.sha256, visuallyInspected: original.sizeGatePassed });
    }
  });

  it("does not count a size-rejected image as inspected", () => {
    expect(review.photos.filter(photo => !photo.visuallyInspected)).toEqual([expect.objectContaining({ photoId: 211848399, sourceSha256: null, status: "NOT_VIEWED_SIZE_REJECTED" })]);
    expect(review.photos.filter(photo => photo.visuallyInspected)).toHaveLength(50);
  });

  it("selects only provisional covers belonging to that candidate", () => {
    const selected = review.candidates.filter(candidate => candidate.selectedPhotoId !== null);
    expect(selected).toHaveLength(17);
    expect(new Set(selected.map(candidate => candidate.selectedPhotoId)).size).toBe(17);
    for (const candidate of selected) {
      expect(candidate.status).toBe("PROVISIONAL_COVER_PENDING_FINAL_CHECKS");
      expect(candidate.comparisonSourceUrls.length).toBeGreaterThan(0);
      expect(intake.candidates.find(entry => entry.candidateId === candidate.candidateId)?.photoIds).toContain(candidate.selectedPhotoId);
      expect(review.photos.find(photo => photo.photoId === candidate.selectedPhotoId)).toMatchObject({ candidateId: candidate.candidateId, status: "PROVISIONAL_COVER", visuallyInspected: true });
    }
  });

  it("keeps nine replacement sets and four missing leads separate from completed uploads", () => {
    expect(review.candidates.filter(candidate => candidate.status === "REPLACEMENT_COVER_NEEDED")).toHaveLength(9);
    const missing = review.candidates.filter(candidate => candidate.status === "NO_DOWNLOADED_LEAD");
    expect(missing.map(candidate => candidate.candidateId).sort()).toEqual(["research-pardo-054", "research-pardo-089", "research-pardo-091", "research-pardo-130"]);
    for (const candidate of missing) expect(intake.candidates.find(entry => entry.candidateId === candidate.candidateId)?.photoIds).toEqual([]);
    expect(review.counts).toEqual({ candidates: 30, downloadedCandidates: 26, photos: 51, visuallyInspected: 50, sizeRejectedNotViewed: 1, provisionalCoverCandidates: 17, needsReplacementOrMissing: 13, newUploads: 0 });
  });

  it("cannot be imported and preserves the sharpness failure and authentication gates", () => {
    expect(readResearch("HERB_REMAINING_THIRTY_VISUAL_REVIEW_2026-10-05.json")).not.toHaveProperty("herbs");
    expect(review.limitations.join(" ")).toMatch(/Kamias.*soft.*replacement cover/);
    expect(review.candidates.find(candidate => candidate.candidateId === "research-pardo-047")).toMatchObject({ selectedPhotoId: null, status: "REPLACEMENT_COVER_NEEDED" });
    expect(review.photos.find(photo => photo.photoId === 65749923)).toMatchObject({ status: "SUPPORTING_ONLY", visuallyInspected: true });
    expect(review.limitations.join(" ")).toMatch(/not expert specimen authentication/);
    for (const photo of review.photos.filter(entry => entry.visuallyInspected)) expect(photo.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
