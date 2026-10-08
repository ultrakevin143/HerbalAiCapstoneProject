import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (file: string): unknown => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const research = (file: string) => readJson(`../../Docs/research/${file}`);
const input = {
  queue: readJson('../content/herbs/expansion-batch-03.review.json'),
  audit: research('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: research('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: research('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: ['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => research(`HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)),
  mediaFollowUp: { manifest: research('HERB_COVER_INTEGRATION_2026-10-07.json'), review: research('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
  catalog: { checkedAt: '2026-10-07T01:00:00.000Z', total: 0, herbs: [] },
};
const setAt = (value: unknown, path: (string | number)[], replacement: unknown) => {
  const parent = path.slice(0, -1).reduce<unknown>((cursor, key) => {
    if (!cursor || typeof cursor !== 'object') throw new Error('Invalid mutation fixture path.');
    return (cursor as Record<string, unknown>)[key];
  }, value);
  const last = path.at(-1);
  if (!parent || typeof parent !== 'object' || last === undefined) throw new Error('Invalid mutation fixture parent.');
  (parent as Record<string, unknown>)[last] = replacement;
};

describe('ownership-bound held media follow-up', () => {
  it.each([
    ['HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json', 'c2b7074642d05aa44282517e8b0dd89fdfc9ddff3d0801a56d86136a1ae7954b'],
    ['HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json', '6d082f6b35ca710bbc5b28c878b3597ec3f598142930283445cff8598b38caf3'],
  ])('preserves historical receipt content across checkout line endings: %s', (file, expectedHash) => {
    const bytes = readFileSync(new URL(`../../Docs/research/${file}`, import.meta.url));
    expect(createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g, '\n')).digest('hex')).toBe(expectedHash);
  });

  it('keeps follow-up research pointed at eleven missing covers, not the earlier thirteen', () => {
    const saved = z.object({ counts: z.object({ missingSelectedCovers: z.literal(11) }),
      rows: z.array(z.object({ candidateId: z.string(), selectedCoverUrl: z.string().nullable() })).length(50),
    }).parse(research('HERB_COVER_INTEGRATION_PUBLIC_PREFLIGHT_2026-10-07.json'));
    expect(saved.rows.filter(row => !row.selectedCoverUrl)).toHaveLength(11);
    for (const candidateId of ['research-pardo-030', 'research-pardo-138']) {
      expect(saved.rows.find(row => row.candidateId === candidateId)?.selectedCoverUrl).toBeTruthy();
    }
    const runner = readFileSync(new URL('../prisma/find-herb-cover-replacements.ts', import.meta.url), 'utf8');
    expect(runner).not.toContain('HERB_COVER_INTEGRATION_PUBLIC_PREFLIGHT_2026-10-07.json');
    expect(runner).toContain('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json');
    expect(runner).toContain('findMissingDraftCoverCandidates(queue, plans)');
    expect(runner).toContain('priorPhotos.add(photo.photoId)');
  });

  it('refuses a research publish flag before reading fixtures or making requests', () => {
    const child = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/find-herb-cover-replacements.ts', '--publish'], {
      encoding: 'utf8', timeout: 15_000,
    });
    expect(child.error).toBeUndefined();
    expect(child.status).toBe(1);
    expect(child.stdout).toBe('');
    expect(child.stderr).toContain('Read-only usage');
  });

  it('links only two checked photos without clearing safety or publication holds', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toMatchObject({ candidates: 50, fullContentDrafts: 49, partialContentDrafts: 1,
      missingSelectedCovers: 11, publicationCleared: 0 });
    expect(report.mediaFollowUpEvidence?.selectedCovers).toBe(2);
    const kabiki = report.rows.find(row => row.localName === 'Kabiki');
    expect(kabiki?.selectedCoverUrl).toContain('kabiki_mimusops_elengi_cc0_338480147_a2wtdy.jpg');
    expect(kabiki?.blockers).toEqual(expect.arrayContaining(['CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED', 'DRAFT_REVIEW_GAPS_OPEN']));
    expect(kabiki?.medicinalInstructionsCleared).toBe(false);
    expect(kabiki?.blockers).not.toContain('SELECTED_COVER_MISSING');
    expect(report.rows.every(row => !row.publicationAllowed && row.blockers.includes('HUMAN_REVIEW_NOT_RECORDED'))).toBe(true);
  });

  it('fails closed if new draft covers are supplied without follow-up evidence', () => {
    expect(() => reviewExpansionReleasePreflight({ queue: input.queue, audit: input.audit, plan: input.plan,
      leads: input.leads, catalog: input.catalog, additionalPlans: input.additionalPlans })).toThrow('Draft cover does not match');
  });

  it.each([
    { path: ['manifest', 'queueId'], value: 'another-queue' },
    { path: ['manifest', 'publicationAllowed'], value: true },
    { path: ['manifest', 'writeAllowed'], value: true },
    { path: ['manifest', 'mediaReviewFile'], value: '../other.json' },
    { path: ['manifest', 'integratedAt'], value: '2026-10-06T00:00:00Z' },
    { path: ['manifest', 'selections', 0, 'candidateId'], value: 'missing-candidate' },
    { path: ['manifest', 'selections', 0, 'photoId'], value: 123 },
    { path: ['manifest', 'selections', 0, 'assetId'], value: 'other_asset' },
    { path: ['manifest', 'selections', 0, 'sha256'], value: '0'.repeat(64) },
    { path: ['manifest', 'selections', 0, 'cloudinaryUrl'], value: 'https://example.com/cover.jpg' },
    { path: ['review', 'uploads', 0, 'localName'], value: 'Another herb' },
    { path: ['review', 'uploads', 0, 'botanicalClearance'], value: true },
    { path: ['review', 'uploads', 0, 'imageCreator'], value: 'no rights reserved' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'scientificName'], value: 'Abutilon theophrasti' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'licenseCode'], value: 'cc-by' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'rank'], value: 'genus' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'quality'], value: 'casual' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'assetUrl'], value: 'https://example.com/photos/39272553/large.jpeg' },
    { path: ['review', 'uploads', 0, 'sourceReview', 'checkedAt'], value: '2026-10-08T00:00:00Z' },
    { path: ['review', 'uploads', 0, 'visualReview', 'imageRetouched'], value: true },
    { path: ['review', 'uploads', 0, 'visualReview', 'syntheticImage'], value: true },
    { path: ['review', 'uploads', 0, 'cloudinary', 'fullDecodePassed'], value: false },
    { path: ['review', 'uploads', 0, 'cloudinary', 'sourceSha256'], value: '0'.repeat(64) },
    { path: ['review', 'uploads', 0, 'cloudinary', 'publicId'], value: 'another_photo' },
    { path: ['review', 'heldOrRejected', 0, 'photoId'], value: 39272553 },
  ])('rejects contradictory or unowned evidence at $path', mutation => {
    const changed = structuredClone(input);
    setAt(changed.mediaFollowUp, mutation.path, mutation.value);
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow();
  });

  it.each(['candidateId', 'observationId', 'sha256', 'bytes', 'width', 'height'])('binds decoded originals to delivery: %s', field => {
    const changed = structuredClone(input);
    const decoded = z.object({ decodedOriginals: z.array(z.object({ photoId: z.number() }).passthrough()) }).parse(changed.mediaFollowUp.review);
    const index = decoded.decodedOriginals.findIndex(row => row.photoId === 39272553);
    expect(index).toBeGreaterThanOrEqual(0);
    setAt(changed.mediaFollowUp.review, ['decodedOriginals', index, field], ['bytes', 'width', 'height', 'observationId'].includes(field) ? 1 : 'wrong');
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow();
  });

  it('rejects duplicate selections rather than counting the same photo twice', () => {
    const changed = structuredClone(input);
    const selections = z.object({ selections: z.array(z.unknown()) }).parse(changed.mediaFollowUp.manifest).selections;
    setAt(changed.mediaFollowUp.manifest, ['selections', 1], structuredClone(selections[0]));
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow('Duplicate media evidence');
  });

  it('cannot use this follow-up to replace an already selected audit image', () => {
    const changed = structuredClone(input);
    const audit = z.object({ candidates: z.array(z.object({ candidateId: z.string() }).passthrough()) }).parse(changed.audit);
    const index = audit.candidates.findIndex(row => row.candidateId === 'research-pardo-030');
    setAt(changed.audit, ['candidates', index, 'image', 'cloudinaryUrl'], 'https://example.com/prior.jpg');
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow('cannot replace');
  });

  it.each([
    ['imageUrl', 'https://example.com/substitute.jpg'], ['imageSourceUrl', 'https://www.inaturalist.org/observations/1'],
    ['imageLicense', 'CC-BY'], ['imageLicenseUrl', 'https://example.com/license'],
    ['imageCreator', 'leaf0605'], ['imageModification', 'Retouched'],
  ])('rejects contradictory draft provenance: %s', (field, value) => {
    const changed = structuredClone(input);
    const fourth = z.object({ draftRows: z.array(z.object({ candidateId: z.string() }).passthrough()) }).parse(changed.additionalPlans[2]);
    const index = fourth.draftRows.findIndex(row => row.candidateId === 'research-pardo-138');
    setAt(changed.additionalPlans[2], ['draftRows', index, 'proposedData', field!], value);
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow();
  });

  it('rejects a draft reference to a different media ledger', () => {
    const changed = structuredClone(input);
    const fourth = z.object({ draftRows: z.array(z.object({ candidateId: z.string() }).passthrough()) }).parse(changed.additionalPlans[2]);
    const index = fourth.draftRows.findIndex(row => row.candidateId === 'research-pardo-138');
    setAt(changed.additionalPlans[2], ['draftRows', index, 'mediaFollowUpEvidenceFile'], 'OTHER.json');
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow('follow-up evidence mismatch');
  });
});
