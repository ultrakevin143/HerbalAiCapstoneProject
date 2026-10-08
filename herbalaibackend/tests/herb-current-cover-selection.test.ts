import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findMissingDraftCoverCandidates } from '../src/content/herb-cover-replacement-research.js';

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const queue = readJson('../content/herbs/expansion-batch-03.review.json');
const planFiles = ['HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
  ...['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => `HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)];
const plans = planFiles.map(file => readJson(`../../Docs/research/${file}`));
const leadReceipt = readJson('../../Docs/research/HERB_REMAINING_ELEVEN_PHOTO_RESEARCH_2026-10-07.json');

describe('current held draft cover selection', () => {
  it('uses the current fifty plans rather than a historical preflight count', () => {
    const missing = findMissingDraftCoverCandidates(queue, plans);
    expect(missing).toHaveLength(11);
    expect(missing.map(row => row.id)).toEqual(leadReceipt.candidates.map((row: {candidateId: string}) => row.candidateId));
    expect(missing.map(row => row.proposedLocalName)).not.toContain('Kabiki');
    expect(missing.map(row => row.scientificName)).not.toContain('Abutilon indicum');
  });

  it('immediately excludes a locally selected cover without rewriting historical receipts', () => {
    const changed = structuredClone(plans);
    const missing = findMissingDraftCoverCandidates(queue, changed)[0]!;
    const row = changed.flatMap(plan => plan.draftRows).find(row => row.candidateId === missing.id);
    row.proposedData.imageUrl = 'https://res.cloudinary.com/dclqw6at7/image/upload/test-only.jpg';
    expect(findMissingDraftCoverCandidates(queue, changed).map(row => row.id)).not.toContain(missing.id);
    expect(findMissingDraftCoverCandidates(queue, plans)).toHaveLength(11);
  });

  it('includes a cover removed from the current plan without relying on a saved count', () => {
    const changed = structuredClone(plans);
    delete changed[0].draftRows[0].proposedData.imageUrl;
    expect(findMissingDraftCoverCandidates(queue, changed)).toHaveLength(12);
  });

  it.each(['missing', 'duplicate', 'foreign-id', 'wrong-species', 'wrong-queue', 'write-enabled', 'publish-enabled', 'wrong-status'])('fails closed on %s draft evidence', mutation => {
    const changed = structuredClone(plans);
    if (mutation === 'missing') changed[0].draftRows.pop();
    if (mutation === 'duplicate') changed[0].draftRows[1] = changed[0].draftRows[0];
    if (mutation === 'foreign-id') changed[0].draftRows[0].candidateId = 'foreign-id';
    if (mutation === 'wrong-species') changed[0].draftRows[0].proposedData.scientificName = 'Wrong species';
    if (mutation === 'wrong-queue') changed[0].queueId = 'wrong-queue';
    if (mutation === 'write-enabled') changed[0].writeAllowed = true;
    if (mutation === 'publish-enabled') changed[0].publicationAllowed = true;
    if (mutation === 'wrong-status') changed[0].status = 'PUBLISHED';
    expect(() => findMissingDraftCoverCandidates(queue, changed)).toThrow();
  });

  it.each(['https://example.com/photo.jpg', 'https://res.cloudinary.com/other/image/upload/photo.jpg',
    'https://user:secret@res.cloudinary.com/dclqw6at7/image/upload/photo.jpg', '', null])('rejects an invalid selected-cover URL: %s', imageUrl => {
    const changed = structuredClone(plans);
    changed[0].draftRows[0].proposedData.imageUrl = imageUrl;
    expect(() => findMissingDraftCoverCandidates(queue, changed)).toThrow();
  });

  it('does not turn photo leads, observer metadata or API labels into publication clearance', () => {
    expect(leadReceipt).toMatchObject({candidatesChecked: 11, requests: 21,
      counts: {candidatesWithLeads: 7, photoLeads: 21}, publicationAllowed: false, uploadAllowed: false});
    for (const photo of leadReceipt.candidates.flatMap((row: {photos: unknown[]}) => row.photos)) {
      expect(photo).toMatchObject({fullDecodePassed: false, visualReview: 'PENDING',
        publicationAllowed: false, uploadAllowed: false, creatorIndependentlyConfirmed: false});
    }
  });

  it('does not treat HTTP 200 partial transfers as usable covers', () => {
    const downloads = readJson('../../Docs/research/HERB_REMAINING_ELEVEN_DOWNLOAD_CHECK_2026-10-07.json');
    expect(downloads).toMatchObject({publicationAllowed: false, uploadAllowed: false, cloudinaryUploads: 0,
      counts: {attempted: 6, http200: 6, completeTransfers: 0, fullDecodePassed: 0, visuallyReviewed: 0, coverSelections: 0}});
    expect(downloads.photos).toHaveLength(6);
    for (const photo of downloads.photos) {
      const lead = leadReceipt.candidates.flatMap((row: {photos: {photoId: number}[]}) => row.photos)
        .find((row: {photoId: number}) => row.photoId === photo.photoId);
      expect(lead).toMatchObject({candidateId: photo.candidateId, observationId: photo.observationId,
        assetUrl: photo.assetUrl, sourceUrl: photo.sourceUrl});
      expect(photo).toMatchObject({httpStatus: 200, curlExitCode: 28, transferComplete: false,
        fullDecodePassed: false, uploadAllowed: false, publicationAllowed: false});
      expect(photo.partialBytesSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
