import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { matchExactResearchTaxon, readBoundedResearchJson, selectReplacementPhotoLeads } from '../src/content/herb-cover-replacement-research.js';

const candidate = { id: 'qa-cover', scientificName: 'Ocimum gratissimum' };
const taxon = { id: 123, name: candidate.scientificName, rank: 'species', is_active: true };
const photo = { id: 456, url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/456/square.jpg',
  license_code: 'cc0', attribution: 'no rights reserved', original_dimensions: { width: 1200, height: 800 } };
const observation = { id: 789, quality_grade: 'research', user: { login: 'public_observer' },
  taxon: { id: taxon.id, name: taxon.name, rank: taxon.rank }, photos: [photo] };
const choose = (results: unknown[], prior: ReadonlySet<number> = new Set()) =>
  selectReplacementPhotoLeads({ results }, candidate, taxon.id, prior);
const mediaReview = z.object({
  status: z.literal('REPLACEMENT_MEDIA_UPLOADED_NOT_PUBLISHED'), publicationAllowed: z.literal(false),
  neonWrites: z.literal(0), cloudinaryUploads: z.literal(2), counts: z.record(z.string(), z.number()),
  uploads: z.array(z.object({ candidateId: z.string(), scientificName: z.string(),
    botanicalClearance: z.literal(false), publicationAllowed: z.literal(false), selectedInDraftPlan: z.literal(false),
    imageCreator: z.null(), sourceReview: z.object({ scientificName: z.string(), rank: z.literal('species'),
      quality: z.literal('research'), photoId: z.number(), observationId: z.number(), assetUrl: z.url(),
      licenseCode: z.literal('cc0'), creatorIndependentlyConfirmed: z.literal(false) }),
    cloudinary: z.object({ cloudName: z.literal('dclqw6at7'), url: z.url(), httpStatus: z.literal(200),
      sha256: z.string().regex(/^[a-f0-9]{64}$/), sourceSha256: z.string(), sourceCopyMatches: z.literal(true),
      deliveryBytesMatch: z.literal(true), fullDecodePassed: z.literal(true), width: z.number(), height: z.number() }),
  })).length(2),
  heldOrRejected: z.array(z.object({ photoId: z.number(), status: z.string() })).length(5),
  decodedOriginals: z.array(z.object({ candidateId: z.string(), photoId: z.number(), sha256: z.string(),
    fullDecodePassed: z.literal(true), sizeGatePassed: z.literal(true) })).length(7),
}).parse(JSON.parse(readFileSync(new URL('../../Docs/research/HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json', import.meta.url), 'utf8')));

describe('read-only replacement photo research', () => {
  it('requires exactly one active exact species match rather than guessing a synonym or hybrid', () => {
    expect(matchExactResearchTaxon({ results: [taxon] }, candidate.scientificName).taxon).toEqual(taxon);
    for (const results of [[], [taxon, taxon], [{ ...taxon, is_active: false }], [{ ...taxon, rank: 'genus' }]]) {
      expect(matchExactResearchTaxon({ results }, candidate.scientificName).taxon).toBeNull();
    }
    const hybrid = { ...taxon, name: 'Citrus × aurantium' };
    expect(matchExactResearchTaxon({ results: [hybrid] }, 'Citrus aurantium')).toEqual({
      taxon: null, alternativeTaxaNotAccepted: ['Citrus × aurantium'] });
  });

  it('preserves exact photo ownership and extension without claiming visual, creator or upload approval', () => {
    const result = choose([observation])[0];
    expect(result).toMatchObject({ candidateId: candidate.id, photoId: photo.id, observationId: observation.id,
      assetUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/456/large.jpg',
      sourceObserver: 'public_observer', attributionText: 'no rights reserved', creatorIndependentlyConfirmed: false,
      fullDecodePassed: false, visualReview: 'PENDING', uploadAllowed: false, publicationAllowed: false,
      sourceRecheckRequiredBeforeUpload: true });
    expect(choose([{ ...observation, user: null }])[0]?.sourceObserver).toBeNull();
    expect(choose([{ ...observation, photos: [{ ...photo, url: photo.url.replace('.jpg', '.jpeg') }] }])[0]?.assetUrl).toContain('/large.jpeg');
  });

  it.each([
    { ...observation, taxon: null },
    { ...observation, quality_grade: 'casual' },
    { ...observation, taxon: { ...observation.taxon, id: 999 } },
    { ...observation, taxon: { ...observation.taxon, name: 'Ocimum tenuiflorum' } },
    { ...observation, taxon: { ...observation.taxon, rank: 'subspecies' } },
  ])('rejects mismatched observation identity or quality %#', changed => {
    expect(choose([changed])).toEqual([]);
  });

  it.each([
    { ...photo, license_code: null }, { ...photo, license_code: 'cc-by' },
    { ...photo, original_dimensions: null }, { ...photo, original_dimensions: { width: 599, height: 1000 } },
    { ...photo, original_dimensions: { width: 799, height: 799 } },
    { ...photo, url: 'https://example.com/photos/456/square.jpg' },
    { ...photo, url: photo.url.replace('/456/', '/457/') },
    { ...photo, url: photo.url + '?token=value' }, { ...photo, url: photo.url + '#fragment' },
    { ...photo, url: photo.url.replace('https://', 'https://user:secret@') },
  ])('rejects unlicensed, undersized or unowned photo %#', changed => {
    expect(choose([{ ...observation, photos: [changed] }])).toEqual([]);
  });

  it('excludes previous rejects and duplicate photo IDs and caps leads at three', () => {
    expect(choose([observation], new Set([photo.id]))).toEqual([]);
    const photos = [456, 456, 457, 458, 459].map(id => ({ ...photo, id,
      url: `https://inaturalist-open-data.s3.amazonaws.com/photos/${id}/square.jpg` }));
    expect(choose([{ ...observation, photos }]).map(entry => entry.photoId)).toEqual([456, 457, 458]);
  });

  it('keeps the saved bounded-search ledger separate from publication permission', () => {
    const report = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_REPLACEMENT_PHOTO_LEADS_2026-10-07.json', import.meta.url), 'utf8'));
    expect(report).toMatchObject({ uploadAllowed: false, publicationAllowed: false, productionWritesPerformed: false,
      candidatesChecked: 13, counts: { candidatesWithLeads: 9, photoLeads: 27 } });
    expect(report.candidates.flatMap((entry: { photos: unknown[] }) => entry.photos)).toHaveLength(27);
  });
});

describe('replacement media receipt boundaries', () => {
  it('separates two storage uploads from the unchanged draft/publication audit', () => {
    expect(mediaReview.counts).toMatchObject({ savedPhotoLeads: 27, successfullyDecodedAfterBoundedRetry: 7,
      visuallyReviewedOriginals: 7, coverQualityPassed: 2, coversHeldOrRejected: 5, uploadedAndByteMatched: 2,
      totalUploadedCoverCandidates: 39, withoutUploadedCoverCandidate: 11,
      selectedCoverHoldsInHistoricalPreflight: 13, originalPreflightHoldsResolvedByManifestIntegration: 0 });
    expect(new Set(mediaReview.decodedOriginals.map(entry => entry.photoId)).size).toBe(7);
  });

  it.each(mediaReview.uploads)('retains source and delivered-byte ownership for $candidateId', uploaded => {
    const queue = z.object({ candidates: z.array(z.object({ id: z.string(), scientificName: z.string() })) })
      .parse(JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')));
    expect(queue.candidates.find(entry => entry.id === uploaded.candidateId)?.scientificName).toBe(uploaded.scientificName);
    expect(uploaded.sourceReview.scientificName).toBe(uploaded.scientificName);
    expect(new URL(uploaded.sourceReview.assetUrl).pathname).toMatch(new RegExp(`^/photos/${uploaded.sourceReview.photoId}/large\\.jpe?g$`));
    expect(new URL(uploaded.sourceReview.assetUrl).origin).toBe('https://inaturalist-open-data.s3.amazonaws.com');
    expect(new URL(uploaded.cloudinary.url).origin).toBe('https://res.cloudinary.com');
    expect(new URL(uploaded.cloudinary.url).pathname).toContain('/dclqw6at7/image/upload/');
    expect(uploaded.cloudinary.sha256).toBe(uploaded.cloudinary.sourceSha256);
    const original = mediaReview.decodedOriginals.find(entry => entry.photoId === uploaded.sourceReview.photoId);
    expect(original?.candidateId).toBe(uploaded.candidateId);
    expect(original?.sha256).toBe(uploaded.cloudinary.sha256);
    expect(Math.min(uploaded.cloudinary.width, uploaded.cloudinary.height)).toBeGreaterThanOrEqual(600);
    expect(Math.max(uploaded.cloudinary.width, uploaded.cloudinary.height)).toBeGreaterThanOrEqual(800);
  });

  it('excludes every visually held or rejected photograph from the uploads', () => {
    for (const entry of mediaReview.heldOrRejected) {
      expect(mediaReview.uploads.some(uploaded => uploaded.sourceReview.photoId === entry.photoId)).toBe(false);
      expect(mediaReview.decodedOriginals.some(original => original.photoId === entry.photoId)).toBe(true);
    }
  });
});

describe('bounded public research JSON reader', () => {
  it('accepts valid JSON exactly within the byte limit', async () => {
    await expect(readBoundedResearchJson(new Response('{"ok":true}'), 11)).resolves.toEqual({ ok: true });
  });

  it('rejects advertised oversized data without reading it and cancels the body', async () => {
    let canceled = false;
    const stream = new ReadableStream<Uint8Array>({ cancel() { canceled = true; } });
    const response = new Response(stream, { headers: { 'content-length': '100' } });
    await expect(readBoundedResearchJson(response, 10)).rejects.toThrow(/exceeds/);
    expect(canceled).toBe(true);
    expect(stream.locked).toBe(false);
  });

  it('enforces streamed bytes even when content-length is absent or understates the body', async () => {
    for (const headers of [{}, { 'content-length': '1' }]) {
      let canceled = false;
      const stream = new ReadableStream<Uint8Array>({ start(controller) {
        controller.enqueue(new TextEncoder().encode('éééééé'));
      }, cancel() { canceled = true; } });
      await expect(readBoundedResearchJson(new Response(stream, { headers }), 10)).rejects.toThrow(/exceeds/);
      expect(canceled).toBe(true);
      expect(stream.locked).toBe(false);
    }
  });

  it('rejects HTTP errors, malformed JSON, missing bodies and invalid limits', async () => {
    await expect(readBoundedResearchJson(new Response('unavailable', { status: 503 }))).rejects.toThrow(/HTTP 503/);
    await expect(readBoundedResearchJson(new Response('not-json'))).rejects.toThrow();
    await expect(readBoundedResearchJson(new Response(null))).rejects.toThrow(/no body/);
    await expect(readBoundedResearchJson(new Response('{}'), 0)).rejects.toThrow(/Invalid/);
  });

  it('releases the reader when the response stream fails', async () => {
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error('connection lost')); } });
    await expect(readBoundedResearchJson(new Response(stream))).rejects.toThrow('connection lost');
    expect(stream.locked).toBe(false);
  });
});
