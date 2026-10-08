import { z } from 'zod';
import { expansionQueueSchema } from './herb-expansion-review.js';

const positiveId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const taxonSchema = z.object({ id: positiveId, name: z.string(), rank: z.string(), is_active: z.boolean() });
const photoSchema = z.object({
  id: positiveId, url: z.url(), license_code: z.string().nullable(), attribution: z.string().nullable(),
  original_dimensions: z.object({ width: z.number().positive(), height: z.number().positive() }).nullable(),
});
const observationSchema = z.object({
  id: positiveId, quality_grade: z.string(), user: z.object({ login: z.string() }).nullable().optional(),
  taxon: z.object({ id: positiveId, name: z.string(), rank: z.string() }).nullable(), photos: z.array(photoSchema),
});

export function findMissingDraftCoverCandidates(queueInput: unknown, planInputs: unknown[]) {
  const queue = expansionQueueSchema.parse(queueInput);
  const plans = planInputs.map(input => z.object({
    queueId: z.literal(queue.batchId), status: z.literal('DRAFT_PLAN_NOT_EXECUTABLE'),
    writeAllowed: z.literal(false), publicationAllowed: z.literal(false),
    draftRows: z.array(z.object({
      candidateId: z.string(), proposedData: z.object({
        scientificName: z.string(), imageUrl: z.url().refine(value => {
          const url = new URL(value);
          return url.origin === 'https://res.cloudinary.com' && !url.username && !url.password
            && url.pathname.startsWith('/dclqw6at7/image/upload/');
        }).optional(),
      }),
    })).min(1).max(50),
  }).parse(input));
  const rows = plans.flatMap(plan => plan.draftRows);
  if (rows.length !== queue.candidates.length || new Set(rows.map(row => row.candidateId)).size !== rows.length) {
    throw new Error('Cover research requires all distinct current draft candidates.');
  }
  const candidates = new Map(queue.candidates.map(candidate => [candidate.id, candidate]));
  for (const row of rows) {
    if (candidates.get(row.candidateId)?.scientificName !== row.proposedData.scientificName) {
      throw new Error('Cover research draft identity mismatch.');
    }
  }
  const selected = new Set(rows.filter(row => row.proposedData.imageUrl).map(row => row.candidateId));
  return queue.candidates.filter(candidate => !selected.has(candidate.id));
}

export function matchExactResearchTaxon(input: unknown, scientificName: string) {
  const lookup = z.object({ results: z.array(taxonSchema) }).parse(input);
  const exact = lookup.results.filter(taxon => taxon.name === scientificName && taxon.rank === 'species' && taxon.is_active);
  return {
    taxon: exact.length === 1 ? exact[0]! : null,
    alternativeTaxaNotAccepted: lookup.results.filter(taxon => taxon.name !== scientificName).map(taxon => taxon.name),
  };
}

export function selectReplacementPhotoLeads(input: unknown, candidate: { id: string; scientificName: string },
  taxonId: number, priorPhotos: ReadonlySet<number>) {
  const observations = z.object({ results: z.array(observationSchema) }).parse(input);
  const selectedIds = new Set<number>();
  const photos = [];
  for (const observation of observations.results) {
    if (observation.quality_grade !== 'research' || observation.taxon?.name !== candidate.scientificName
      || observation.taxon.id !== taxonId || observation.taxon.rank !== 'species') continue;
    for (const photo of observation.photos) {
      if (photos.length >= 3 || photo.license_code !== 'cc0' || priorPhotos.has(photo.id) || selectedIds.has(photo.id)) continue;
      const dimensions = photo.original_dimensions;
      const assetUrl = new URL(photo.url);
      if (!dimensions || Math.min(dimensions.width, dimensions.height) < 600 || Math.max(dimensions.width, dimensions.height) < 800
        || assetUrl.origin !== 'https://inaturalist-open-data.s3.amazonaws.com'
        || !new RegExp(`^/photos/${photo.id}/square\\.jpe?g$`).test(assetUrl.pathname)
        || assetUrl.search || assetUrl.hash || assetUrl.username || assetUrl.password) continue;
      assetUrl.pathname = assetUrl.pathname.replace('/square.', '/large.');
      selectedIds.add(photo.id);
      photos.push({ candidateId: candidate.id, queueScientificName: candidate.scientificName,
        observationTaxon: observation.taxon.name, observationRank: observation.taxon.rank,
        observationQuality: observation.quality_grade, observationId: observation.id, photoId: photo.id,
        sourceObserver: observation.user?.login ?? null, attributionText: photo.attribution,
        creatorIndependentlyConfirmed: false, sourceUrl: `https://www.inaturalist.org/observations/${observation.id}`,
        assetUrl: assetUrl.href, licenseCodeObserved: 'cc0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        originalWidth: dimensions.width, originalHeight: dimensions.height, fullDecodePassed: false,
        visualReview: 'PENDING', uploadAllowed: false, publicationAllowed: false, sourceRecheckRequiredBeforeUpload: true });
    }
  }
  return photos;
}

export async function readBoundedResearchJson(response: Response, maxBytes = 8_000_000): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid research response byte limit');
  const body = response.body;
  if (!body) throw new Error('Research API returned no body');
  const reader = body.getReader();
  try {
    if (!response.ok) throw new Error(`Research API returned HTTP ${response.status}`);
    const declared = response.headers.get('content-length');
    if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) throw new Error('Research API response exceeds the review limit');
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      totalBytes += chunk.value.byteLength;
      if (totalBytes > maxBytes) throw new Error('Research API response exceeds the review limit');
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
