import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import { findMissingDraftCoverCandidates, matchExactResearchTaxon, readBoundedResearchJson, selectReplacementPhotoLeads } from '../src/content/herb-cover-replacement-research.js';
import { expansionQueueSchema } from '../src/content/herb-expansion-review.js';
import { integrateCheckedExpansionMediaPlans, reviewExpansionMediaFollowUp } from '../src/content/herb-expansion-media-follow-up.js';

const readJson = async (relative: string): Promise<unknown> => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const requestJson = async (url: URL): Promise<unknown> => {
  if (url.origin !== 'https://api.inaturalist.org') throw new Error('Unexpected research API origin');
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'error', headers: { Accept: 'application/json' } });
  return readBoundedResearchJson(response);
};

const main = async () => {
  if (process.argv.slice(2).join(' ') !== '--research-only') throw new Error('Read-only usage: tsx prisma/find-herb-cover-replacements.ts --research-only');
  const queue = await readJson('../content/herbs/expansion-batch-03.review.json');
  const planFiles = ['HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
    ...['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => `HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)];
  const basePlans = await Promise.all(planFiles.map(file => readJson(`../../Docs/research/${file}`)));
  const nextReview = await readJson('../../Docs/research/HERB_NIPA_KASTULI_MEDIA_RECOVERY_2026-10-07.json');
  const nextManifest = await readJson('../../Docs/research/HERB_NIPA_KASTULI_COVER_INTEGRATION_2026-10-07.json');
  const audit = z.object({ candidates: z.array(z.object({ candidateId: z.string(),
    image: z.object({ status: z.string(), cloudinaryUrl: z.string().optional() }),
  })) }).parse(await readJson('../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'));
  const checkedQueue = expansionQueueSchema.parse(queue);
  const plans = integrateCheckedExpansionMediaPlans(basePlans, reviewExpansionMediaFollowUp({
    manifest: nextManifest, review: nextReview, queueId: checkedQueue.batchId,
    candidates: checkedQueue.candidates, auditRows: audit.candidates,
  }));
  const candidates = findMissingDraftCoverCandidates(queue, plans);
  const intake = z.object({ photos: z.array(z.object({ photoId: z.number() })) })
    .parse(await readJson('../../Docs/research/HERB_REMAINING_THIRTY_DOWNLOAD_INTAKE_2026-10-05.json'));
  const priorPhotos = new Set(intake.photos.map(photo => photo.photoId));
  const followUp = z.object({ decodedOriginals: z.array(z.object({ photoId: z.number().int().positive() })) })
    .parse(await readJson('../../Docs/research/HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json'));
  for (const photo of followUp.decodedOriginals) priorPhotos.add(photo.photoId);
  const recovered = z.object({ decodedOriginals: z.array(z.object({ photoId: z.number().int().positive() })) }).parse(nextReview);
  for (const photo of recovered.decodedOriginals) priorPhotos.add(photo.photoId);
  const results = [];
  let requests = 0;
  for (const candidate of candidates) {
    const row = { candidateId: candidate.id, localName: candidate.proposedLocalName, scientificName: candidate.scientificName,
      checkedAt: new Date().toISOString(), status: 'NO_REPLACEMENT_SELECTED', uploadAllowed: false, publicationAllowed: false,
      alternativeTaxaNotAccepted: [] as string[], photos: [] as Record<string, unknown>[], error: null as string | null };
    try {
      const lookupUrl = new URL('https://api.inaturalist.org/v1/taxa');
      lookupUrl.search = new URLSearchParams({ q: candidate.scientificName, per_page: '10' }).toString();
      requests += 1;
      const lookup = matchExactResearchTaxon(await requestJson(lookupUrl), candidate.scientificName);
      row.alternativeTaxaNotAccepted = lookup.alternativeTaxaNotAccepted;
      if (!lookup.taxon) {
        row.status = 'EXACT_API_TAXON_UNRESOLVED';
        results.push(row);
        continue;
      }
      const taxon = lookup.taxon;
      const observationsUrl = new URL('https://api.inaturalist.org/v1/observations');
      observationsUrl.search = new URLSearchParams({ taxon_id: String(taxon.id), quality_grade: 'research', photos: 'true',
        photo_license: 'cc0', per_page: '10', order_by: 'votes', order: 'desc' }).toString();
      requests += 1;
      row.photos = selectReplacementPhotoLeads(await requestJson(observationsUrl), candidate, taxon.id, priorPhotos);
      row.status = row.photos.length ? 'LICENSED_REPLACEMENT_LEADS_ONLY' : 'NO_NEW_QUALIFYING_PHOTO_IN_BOUNDED_RESULTS';
    } catch (error) {
      row.status = 'RESEARCH_REQUEST_FAILED';
      row.error = error instanceof Error ? error.message : 'Unknown research request failure';
    }
    results.push(row);
  }
  console.log(JSON.stringify({ schemaVersion: 1, status: 'REPLACEMENT_MEDIA_RESEARCH_NOT_IMPORTABLE', checkedAt: new Date().toISOString(),
    uploadAllowed: false, publicationAllowed: false, productionWritesPerformed: false, candidatesChecked: results.length, requests,
    counts: { candidatesWithLeads: results.filter(row => row.photos.length).length, photoLeads: results.reduce((sum, row) => sum + row.photos.length, 0) },
    limitations: ['At most ten observations and three new per-photo CC0 leads per candidate. No retries or adjacent-species substitutions.',
      'Original dimensions and research-grade labels do not establish sharpness, specimen authentication or medicinal safety.',
      'Only exact active species matches are accepted. Historical, synonym and hybrid mappings remain held.',
      'Public observer coordinates and full profiles were not retained. A public observer login, where returned, is not verified creator attribution. No image, credential, database or Cloudinary write is performed.'],
    candidates: results }));
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Replacement photo research failed');
  process.exitCode = 1;
});
