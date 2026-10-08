import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema, findIdentityConflicts } from "../src/content/herb-expansion-review.js";

interface NameReview {
  candidateId: string;
  queueScientificName: string;
  proposedScientificName: string | null;
  queueTaxonKey: string;
  reviewedSynonyms: string[];
  queueChanged: boolean;
  acceptedTaxonKeyChanged: boolean;
  stagingAllowed: boolean;
  publicationAllowed: boolean;
  inaturalistRank?: string;
}

interface MediaReview {
  candidateId: string;
  scientificName: string;
  queueScientificName: string;
  photoId: number;
  observationId: number;
  observationTaxon: string;
  observationRank: string;
  observationQuality: string;
  sourceUrl: string;
  licenseCodeObserved: string;
  derivative: string;
  width: number;
  height: number;
  sha256: string;
  fullDecodePassed: boolean;
  uploadAllowed: boolean;
  publicationAllowed: boolean;
  visualReview: string;
  visualNotes: string;
  cloudinaryUrl: string | null;
  cloudinaryAssetId: string | null;
  cloudinaryPublicId: string | null;
  deliveryHttpStatus?: number;
  deliveryContentType?: string;
  deliveryOriginalSha256Matches?: boolean;
  deliverySha256?: string;
}

const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")));
const followup = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_IDENTITY_MEDIA_FOLLOW_UP_2026-10-05.json", import.meta.url), "utf8")) as {
  status: string;
  publicationAllowed: boolean;
  stagingAllowed: boolean;
  counts: Record<string, number>;
  taxonomyReview: NameReview[];
  photos: MediaReview[];
  emptyPhotoQueries: { candidateId: string; queryTotal: number; status: string; photos: unknown[] }[];
};
const previous = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_SECOND_TEN_PHOTO_REVIEW_2026-10-05.json", import.meta.url), "utf8")) as {
  counts: { uploaded: number };
  photos: { photoId: number; sizeGatePassed: boolean; sha256: string }[];
};

describe("herb identity and media follow-up", () => {
  it("preserves reviewed queue names and identifiers rather than silently migrating taxonomy", () => {
    expect(followup.taxonomyReview).toHaveLength(3);
    for (const review of followup.taxonomyReview) {
      expect(queue.candidates.find(candidate => candidate.id === review.candidateId)).toMatchObject({ scientificName: review.queueScientificName, acceptedTaxonKey: review.queueTaxonKey });
      expect(review).toMatchObject({ queueChanged: false, acceptedTaxonKeyChanged: false, stagingAllowed: false, publicationAllowed: false });
    }
    expect(followup.taxonomyReview.find(review => review.candidateId === "research-pardo-054")?.proposedScientificName).toBeNull();
    expect(followup.taxonomyReview.find(review => review.candidateId === "research-pardo-015")?.inaturalistRank).toBe("subspecies");
  });

  it("retains explicit historical synonyms for any later proposed-name duplicate comparison", () => {
    for (const review of followup.taxonomyReview.filter(review => review.proposedScientificName !== null)) {
      const input = structuredClone(queue);
      const candidate = input.candidates.find(candidate => candidate.id === review.candidateId);
      if (!candidate || !review.proposedScientificName) throw new Error("Missing name-review fixture");
      candidate.scientificName = review.proposedScientificName;
      candidate.scientificSynonyms = [...new Set([...candidate.scientificSynonyms, review.queueScientificName, ...review.reviewedSynonyms])];
      const proposed = expansionQueueSchema.parse(input);
      expect(findIdentityConflicts(proposed, [{ id: "existing-other-treatment", localName: "Different", scientificName: review.queueScientificName }]).some(conflict => conflict.candidateId === review.candidateId)).toBe(true);
    }
  });

  it("records actual visual screening and exact individual source permissions for all nine images", () => {
    expect(followup.counts).toEqual({ newDownloads: 8, previouslyDownloadedReinspected: 1, fullDecodePassed: 9, visuallyInspected: 9, selected: 3, uploaded: 3 });
    expect(followup.photos).toHaveLength(9);
    expect(new Set(followup.photos.map(photo => photo.photoId)).size).toBe(9);
    for (const photo of followup.photos) {
      expect(photo).toMatchObject({ observationQuality: "research", licenseCodeObserved: "cc0", fullDecodePassed: true, publicationAllowed: false });
      expect(photo.sourceUrl).toBe(`https://www.inaturalist.org/observations/${photo.observationId}`);
      expect(Math.max(photo.width, photo.height)).toBeGreaterThanOrEqual(800);
      expect(Math.min(photo.width, photo.height)).toBeGreaterThanOrEqual(600);
      expect(queue.candidates.find(candidate => candidate.id === photo.candidateId)?.scientificName).toBe(photo.queueScientificName);
    }
  });

  it("does not erase failed lower-resolution derivatives when selecting a larger source original", () => {
    const chosen = followup.photos.find(photo => photo.photoId === 312217428);
    const earlier = previous.photos.find(photo => photo.photoId === 312217428);
    expect(chosen).toMatchObject({ derivative: "original", visualReview: "SELECTED", width: 1152, height: 2048 });
    expect(earlier?.sizeGatePassed).toBe(false);
    expect(chosen?.sha256).not.toBe(earlier?.sha256);
    expect(previous.counts.uploaded).toBe(7);
    expect(chosen?.visualNotes).toContain("foliage cover");
  });

  it("requires successful delivery and matching hashes for the three uploads only", () => {
    const selected = followup.photos.filter(photo => photo.uploadAllowed);
    expect(selected.map(photo => photo.photoId).sort((first, second) => first - second)).toEqual([62230932, 131251463, 312217428]);
    for (const photo of selected) {
      expect(photo).toMatchObject({ deliveryHttpStatus: 200, deliveryContentType: "image/jpeg", deliveryOriginalSha256Matches: true });
      expect(photo.cloudinaryAssetId).toMatch(/^[a-f0-9]{32}$/);
      expect(photo.cloudinaryPublicId).toContain(`_cc0_${photo.photoId}_`);
      expect(photo.cloudinaryUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/dclqw6at7\/image\/upload\/v[0-9]+\//);
      expect(photo.deliverySha256).toBe(photo.sha256);
    }
    for (const photo of followup.photos.filter(photo => !photo.uploadAllowed)) expect(photo.cloudinaryUrl).toBeNull();
    expect(followup.photos.find(photo => photo.photoId === 62230932)).toMatchObject({ observationTaxon: "Raphanus raphanistrum sativus", observationRank: "subspecies" });
  });

  it("keeps empty exact-license searches and publication gates explicit", () => {
    expect(followup).toMatchObject({ status: "IDENTITY_AND_MEDIA_FOLLOW_UP_NOT_IMPORTABLE", stagingAllowed: false, publicationAllowed: false });
    expect(followup).not.toHaveProperty("herbs");
    expect(followup.emptyPhotoQueries.map(query => query.candidateId)).toEqual(["research-pardo-089", "research-pardo-091", "research-pardo-130", "research-pardo-054"]);
    for (const query of followup.emptyPhotoQueries) expect(query).toMatchObject({ queryTotal: 0, status: "NO_QUALIFYING_CC0_LEAD", photos: [] });
  });
});
