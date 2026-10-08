import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

interface ReviewedPhoto {
  candidateId: string;
  scientificName: string;
  photoId: number;
  observationId: number;
  observationQuality: string;
  sourceUrl: string;
  assetUrl: string;
  license: string;
  licenseCodeObserved: string;
  licenseUrl: string;
  fullDecodePassed: boolean;
  provenanceRechecked: boolean;
  sizeGatePassed: boolean;
  width: number;
  height: number;
  sha256: string;
  visualReview: string;
  visualReviewedAt: string | null;
  visualNotes: string;
  morphologySourceId: string;
  uploadAllowed: boolean;
  publicationAllowed: boolean;
  cloudinaryUrl: string | null;
  cloudinaryPublicId: string | null;
  cloudinaryAssetId: string | null;
  deliveryHttpStatus?: number;
  deliveryContentType?: string;
  deliveryOriginalSha256Matches?: boolean;
  deliverySha256?: string;
  deliveryWidth?: number;
  deliveryHeight?: number;
}

interface ReviewedCandidate {
  candidateId: string;
  scientificName: string;
  proposedLocalName: string;
  selectedPhotoId: number | null;
  status: string;
  identityApproved: boolean;
  medicalApproved: boolean;
  publicationAllowed: boolean;
}

const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const ledger = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_SECOND_TEN_PHOTO_REVIEW_2026-10-05.json", import.meta.url), "utf8")) as {
  status: string;
  publicationAllowed: boolean;
  counts: Record<string, number>;
  candidates: ReviewedCandidate[];
  photos: ReviewedPhoto[];
  morphologySources: { candidateId: string; id: string; url: string; scope: string }[];
};

describe("second-ten visual and delivery evidence", () => {
  it("preserves the ten research identities and the three unresolved selections", () => {
    const candidates = queue.candidates.filter(candidate => candidate.batch === 2);
    expect(ledger.candidates).toHaveLength(10);
    expect(new Set(ledger.candidates.map(candidate => candidate.candidateId)).size).toBe(10);
    for (const candidate of candidates) {
      expect(ledger.candidates.find(entry => entry.candidateId === candidate.id)).toMatchObject({
        scientificName: candidate.scientificName, proposedLocalName: candidate.proposedLocalName,
        identityApproved: false, medicalApproved: false, publicationAllowed: false,
      });
    }
    expect(ledger.candidates.filter(candidate => candidate.selectedPhotoId === null).map(candidate => candidate.proposedLocalName)).toEqual(["Mustasa", "Radish", "Maize"]);
    expect(ledger.candidates.filter(candidate => candidate.selectedPhotoId !== null)).toHaveLength(7);
  });

  it("distinguishes full decoding, size failures and actual visual inspection", () => {
    expect(ledger.counts).toEqual({ candidates: 10, downloadAttempts: 34, integrityPassed: 30, integrityFailed: 4, visuallyInspected: 30, selected: 7, uploaded: 7, fullDecoded: 34 });
    expect(ledger.photos).toHaveLength(34);
    expect(new Set(ledger.photos.map(photo => photo.photoId)).size).toBe(34);
    expect(ledger.photos.filter(photo => photo.visualReviewedAt !== null)).toHaveLength(30);
    expect(ledger.photos.filter(photo => !photo.sizeGatePassed)).toHaveLength(4);
    for (const photo of ledger.photos) {
      expect(photo.fullDecodePassed).toBe(true);
      expect(photo.sizeGatePassed).toBe(Math.max(photo.width, photo.height) >= 800 && Math.min(photo.width, photo.height) >= 600);
      if (!photo.sizeGatePassed) expect(photo.visualReview).toBe("NOT_REVIEWED_SIZE_FAILED");
    }
  });

  it("retains per-photo licensing and exact source identity rather than observation-level permission assumptions", () => {
    for (const photo of ledger.photos) {
      expect(photo).toMatchObject({ observationQuality: "research", provenanceRechecked: true, license: "CC0 1.0", licenseCodeObserved: "cc0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" });
      expect(photo.sourceUrl).toBe(`https://www.inaturalist.org/observations/${photo.observationId}`);
      expect(photo.assetUrl).toMatch(new RegExp(`^https://inaturalist-open-data\\.s3\\.amazonaws\\.com/photos/${photo.photoId}/large\\.(?:jpe?g|png)$`));
      expect(photo.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(ledger.candidates.find(candidate => candidate.candidateId === photo.candidateId)?.scientificName).toBe(photo.scientificName);
    }
  });

  it("requires a selected, size-cleared image and matching delivered bytes for every recorded upload", () => {
    const uploaded = ledger.photos.filter(photo => photo.cloudinaryUrl !== null);
    expect(uploaded).toHaveLength(7);
    for (const photo of uploaded) {
      expect(photo).toMatchObject({ uploadAllowed: true, visualReview: "SELECTED", sizeGatePassed: true, deliveryHttpStatus: 200, deliveryContentType: "image/jpeg", deliveryOriginalSha256Matches: true });
      expect(photo.cloudinaryAssetId).toMatch(/^[a-f0-9]{32}$/);
      expect(photo.cloudinaryPublicId).toContain(`_cc0_${photo.photoId}_`);
      expect(photo.cloudinaryUrl).toMatch(new RegExp(`^https://res\\.cloudinary\\.com/dclqw6at7/image/upload/v[0-9]+/${photo.cloudinaryPublicId}\\.jpg$`));
      expect(photo.deliverySha256).toBe(photo.sha256);
      expect([photo.deliveryWidth, photo.deliveryHeight]).toEqual([photo.width, photo.height]);
      expect(ledger.candidates.find(candidate => candidate.candidateId === photo.candidateId)?.selectedPhotoId).toBe(photo.photoId);
    }
    for (const photo of ledger.photos.filter(photo => photo.visualReview !== "SELECTED")) {
      expect(photo).toMatchObject({ uploadAllowed: false, cloudinaryUrl: null, cloudinaryAssetId: null, cloudinaryPublicId: null });
    }
  });

  it("resolves morphology evidence while preserving quality and taxonomy caveats", () => {
    for (const photo of ledger.photos.filter(photo => photo.visualReviewedAt !== null)) {
      expect(ledger.morphologySources.find(source => source.id === photo.morphologySourceId)).toMatchObject({ candidateId: photo.candidateId });
      expect(photo.visualNotes.length).toBeGreaterThan(30);
    }
    expect(ledger.photos.find(photo => photo.photoId === 524699848)).toMatchObject({ visualReview: "REJECTED_CATALOG", uploadAllowed: false });
    expect(ledger.photos.find(photo => photo.photoId === 131251463)).toMatchObject({ visualReview: "HELD_TAXONOMY", uploadAllowed: false });
    expect(ledger.photos.find(photo => photo.photoId === 59112165)?.visualNotes).toContain("cultivated hybrids");
  });

  it("never converts media upload success into importable or medically approved content", () => {
    expect(ledger).toMatchObject({ status: "SELECTED_MEDIA_NOT_PUBLICATION_APPROVAL", publicationAllowed: false });
    expect(ledger).not.toHaveProperty("herbs");
    expect(ledger.photos.every(photo => photo.publicationAllowed === false)).toBe(true);
    expect(ledger.candidates.every(candidate => candidate.medicalApproved === false && candidate.identityApproved === false)).toBe(true);
  });
});
