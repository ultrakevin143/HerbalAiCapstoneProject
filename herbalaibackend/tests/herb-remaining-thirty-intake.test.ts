import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

interface IntakePhoto {
  candidateId: string;
  scientificName: string;
  photoId: number;
  observationId: number;
  observationTaxon: string;
  observationQuality: string;
  sourceUrl: string;
  licenseCodeObserved: string;
  provenanceRechecked: boolean;
  status: string;
  fullDecodePassed: boolean | null;
  sizeGatePassed: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  sha256: string | null;
  error?: string;
  visualReview: string;
  uploadAllowed: boolean;
  stagingAllowed: boolean;
  publicationAllowed: boolean;
  cloudinaryUrl: string | null;
}

const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const intake = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_REMAINING_THIRTY_DOWNLOAD_INTAKE_2026-10-05.json", import.meta.url), "utf8")) as {
  status: string;
  uploadAllowed: boolean;
  stagingAllowed: boolean;
  publicationAllowed: boolean;
  counts: Record<string, number>;
  requestRecovery: Record<string, string | number | boolean>;
  candidates: { candidateId: string; scientificName: string; batch: number; photoIds: number[] }[];
  photos: IntakePhoto[];
};

describe("remaining-thirty local photo intake", () => {
  it("covers the remaining thirty queue identities without silently adding substitutes", () => {
    const remaining = queue.candidates.filter(candidate => candidate.batch > 2);
    expect(intake.candidates).toHaveLength(30);
    expect(new Set(intake.candidates.map(candidate => candidate.candidateId)).size).toBe(30);
    for (const candidate of remaining) expect(intake.candidates.find(entry => entry.candidateId === candidate.id)).toMatchObject({ scientificName: candidate.scientificName, batch: candidate.batch });
  });

  it("reconciles actual download counts without counting search gaps as completed media", () => {
    expect(intake.counts).toEqual({ candidates: 30, candidatesWithLeads: 26, attemptedDownloads: 51, fullDecodeAndSizePassed: 50, notSizeCleared: 1, visuallyInspected: 0, uploaded: 0 });
    expect(intake.photos).toHaveLength(51);
    expect(new Set(intake.photos.map(photo => photo.photoId)).size).toBe(51);
    expect(intake.photos.filter(photo => photo.status === "FULL_DECODE_PASSED")).toHaveLength(50);
    for (const candidate of intake.candidates) expect(candidate.photoIds).toEqual(intake.photos.filter(photo => photo.candidateId === candidate.candidateId).map(photo => photo.photoId));
    expect(intake.candidates.filter(candidate => candidate.photoIds.length === 0)).toHaveLength(4);
  });

  it("retains exact individually rechecked taxon and CC0 provenance", () => {
    for (const photo of intake.photos) {
      expect(photo).toMatchObject({ provenanceRechecked: true, observationQuality: "research", licenseCodeObserved: "cc0" });
      expect(photo.observationTaxon).toBe(photo.scientificName);
      expect(photo.sourceUrl).toBe(`https://www.inaturalist.org/observations/${photo.observationId}`);
      expect(intake.candidates.find(candidate => candidate.candidateId === photo.candidateId)?.scientificName).toBe(photo.scientificName);
    }
  });

  it("requires size, full decode and a real byte hash for each cleared download", () => {
    for (const photo of intake.photos.filter(photo => photo.status === "FULL_DECODE_PASSED")) {
      expect(photo).toMatchObject({ fullDecodePassed: true, sizeGatePassed: true });
      expect(Math.max(photo.width ?? 0, photo.height ?? 0)).toBeGreaterThanOrEqual(800);
      expect(Math.min(photo.width ?? 0, photo.height ?? 0)).toBeGreaterThanOrEqual(600);
      expect(photo.bytes).toBeGreaterThan(0);
      expect(photo.bytes).toBeLessThanOrEqual(10485760);
      expect(photo.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(intake.photos.filter(photo => photo.status !== "FULL_DECODE_PASSED")).toEqual([expect.objectContaining({ photoId: 211848399, fullDecodePassed: null, sizeGatePassed: false, sha256: null, error: "Derivative below the orientation-neutral size gate" })]);
  });

  it("does not convert successful downloads into visual review, uploads or publishable records", () => {
    expect(intake).toMatchObject({ status: "DOWNLOAD_INTAKE_NOT_VISUALLY_REVIEWED_NOT_IMPORTABLE", uploadAllowed: false, stagingAllowed: false, publicationAllowed: false });
    expect(intake).not.toHaveProperty("herbs");
    for (const photo of intake.photos) {
      expect(photo).toMatchObject({ visualReview: "PENDING", uploadAllowed: false, stagingAllowed: false, publicationAllowed: false, cloudinaryUrl: null });
      expect(photo).not.toHaveProperty("localPath");
    }
  });

  it("records observed chunk recovery without claiming an unverified endpoint limit", () => {
    expect(intake.requestRecovery).toEqual({ initialCombinedRequest: "HTTP_422_NO_DOWNLOADS_COMPLETED", boundedChunkSize: 10, chunksSucceeded: 4, observationIdsRequested: 38, observationIdsReturned: 38, endpointLimitConfirmed: false });
  });
});
