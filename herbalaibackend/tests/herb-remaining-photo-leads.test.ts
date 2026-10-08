import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema } from "../src/content/herb-expansion-review.js";

interface PhotoLead {
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
  originalWidth: number;
  originalHeight: number;
  visualReview: string;
  cloudinaryUrl: null;
  fullDecodePassed: null;
  sha256: null;
  derivativeWidth: null;
  derivativeHeight: null;
  uploadAllowed: boolean;
}

interface CandidateLead {
  candidateId: string;
  scientificName: string;
  batch: number;
  bookEntry: number;
  proposedLocalName: string;
  photoIds: number[];
  status: string;
  reviewed: boolean;
  publicationAllowed: boolean;
}

const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const ledger = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_REMAINING_FORTY_PHOTO_LEADS_2026-10-05.json", import.meta.url), "utf8")) as {
  status: string;
  publicationAllowed: boolean;
  uploadAllowed: boolean;
  candidatesChecked: number;
  candidatesWithLeads: number;
  photoLeadCount: number;
  candidates: CandidateLead[];
  photos: PhotoLead[];
  errors: { candidateId: string; error: string }[];
};

describe("remaining-forty provisional photo evidence", () => {
  it("covers exactly the remaining queue identities without replacing historical mappings", () => {
    const remaining = queue.candidates.filter(candidate => candidate.batch > 1);
    expect(ledger.candidatesChecked).toBe(40);
    expect(ledger.candidates).toHaveLength(40);
    expect(new Set(ledger.candidates.map(candidate => candidate.candidateId)).size).toBe(40);
    for (const candidate of remaining) {
      expect(ledger.candidates.find(entry => entry.candidateId === candidate.id)).toMatchObject({ scientificName: candidate.scientificName, batch: candidate.batch, bookEntry: candidate.book.entry, proposedLocalName: candidate.proposedLocalName });
    }
  });

  it("reconciles counts and individual photos after the two bounded network retries", () => {
    expect(ledger.photoLeadCount).toBe(69);
    expect(ledger.photos).toHaveLength(69);
    expect(new Set(ledger.photos.map(photo => photo.photoId)).size).toBe(69);
    expect(ledger.candidatesWithLeads).toBe(35);
    expect(ledger.candidates.filter(candidate => candidate.photoIds.length)).toHaveLength(35);
    expect(ledger.errors.every(error => !error.error.startsWith("curl:"))).toBe(true);
  });

  it("retains individual CC0 provenance with exact source photo and observation IDs", () => {
    for (const photo of ledger.photos) {
      expect(photo).toMatchObject({ license: "CC0 1.0", licenseCodeObserved: "cc0", observationQuality: "research", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" });
      expect(photo.sourceUrl).toBe(`https://www.inaturalist.org/observations/${photo.observationId}`);
      expect(photo.assetUrl).toMatch(new RegExp(`^https://inaturalist-open-data\\.s3\\.amazonaws\\.com/photos/${photo.photoId}/large\\.(?:jpe?g|png)$`));
      expect(Math.min(photo.originalWidth, photo.originalHeight)).toBeGreaterThanOrEqual(600);
    }
  });

  it("does not promote metadata leads into completed downloads, visual checks or uploads", () => {
    for (const photo of ledger.photos) {
      expect(photo).toMatchObject({ visualReview: "PENDING", cloudinaryUrl: null, fullDecodePassed: null, sha256: null, derivativeWidth: null, derivativeHeight: null, uploadAllowed: false });
    }
    for (const candidate of ledger.candidates) expect(candidate).toMatchObject({ reviewed: false, publicationAllowed: false });
  });

  it("ties each lead to its candidate and enforces the bounded two-photo search", () => {
    for (const candidate of ledger.candidates) {
      const photos = ledger.photos.filter(photo => photo.candidateId === candidate.candidateId);
      expect(candidate.photoIds).toEqual(photos.map(photo => photo.photoId));
      expect(photos.length).toBeLessThanOrEqual(2);
      for (const photo of photos) expect(photo.scientificName).toBe(candidate.scientificName);
    }
  });

  it("keeps unresolved taxonomy queries distinct from empty qualifying-photo queries", () => {
    expect(ledger.candidates.filter(candidate => !candidate.photoIds.length).map(candidate => candidate.proposedLocalName)).toEqual(["Radish", "Alibangbang", "Kupang", "Kahel", "Ayapana"]);
    expect(ledger.candidates.filter(candidate => candidate.status === "EXACT_TAXON_MATCH_NOT_FOUND_IN_QUERY").map(candidate => candidate.proposedLocalName)).toEqual(["Radish", "Kahel"]);
    expect(ledger.candidates.filter(candidate => candidate.status === "NO_QUALIFYING_CC0_LEAD_IN_BOUNDED_QUERY")).toHaveLength(3);
    expect(ledger.errors).toHaveLength(2);
  });

  it("remains a nonimportable, nonpublishing research ledger", () => {
    expect(ledger).toMatchObject({ status: "UNREVIEWED_MEDIA_LEADS_NOT_IMPORTABLE", publicationAllowed: false, uploadAllowed: false });
    expect(ledger).not.toHaveProperty("herbs");
  });
});
