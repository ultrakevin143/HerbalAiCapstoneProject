import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (relative: string): unknown => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const documentSchema = z.object({
  queueId: z.string(), evidenceFile: z.string(), snapshotCapturedAt: z.null(),
  publicationAllowed: z.literal(false), writeAllowed: z.literal(false), stagingAllowed: z.literal(false),
  draftRows: z.array(z.object({
    candidateId: z.string(), reviewGaps: z.array(z.string()), uncitedFields: z.array(z.string()),
    identityNotes: z.object({ historicalMappingHeld: z.boolean() }).passthrough(),
    regionalNameReview: z.object({ modernRegionalMappingCleared: z.literal(false) }).passthrough(),
    preparationReview: z.object({ kind: z.string(), medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false) }).passthrough(),
    occurrenceReview: z.object({ absenceClaimed: z.literal(false) }).passthrough(),
    proposedData: z.object({
      localName: z.string(), scientificName: z.string(), preparationMethod: z.string(),
      dosage: z.string(), warnings: z.string(), regionFound: z.string().optional(), imageUrl: z.string().optional(),
      publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
      isVerified: z.literal(false), reviewedById: z.null(), embedding: z.null(),
    }).passthrough(),
    proposedSources: z.array(z.object({ id: z.string(), url: z.string(), supports: z.array(z.string()) }).passthrough()),
  }).passthrough()).length(10),
}).passthrough();
const thirdPlan = documentSchema.parse(readJson('../../Docs/research/HERB_THIRD_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const preparation = z.object({
  records: z.array(z.object({ candidateId: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()) })),
}).parse(readJson('../../Docs/research/HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json'));
const input = {
  queue: readJson('../content/herbs/expansion-batch-03.review.json'),
  audit: readJson('../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('../../Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: [readJson('../../Docs/research/HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'), thirdPlan],
  catalog: { checkedAt: '2026-10-07T00:00:00.000Z', total: 0, herbs: [] },
};

describe('third-ten held field drafts', () => {
  it('assembles thirty held plans without hiding one location gap or thirteen missing covers', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toMatchObject({ draftPlansPresent: 30, fullContentDrafts: 29,
      partialContentDrafts: 1, missingFullContentDrafts: 21, missingSelectedCovers: 13,
      heldSecondaryIdentities: 2, publicationCleared: 0 });
    expect(report.draftEvidence[2]?.privateSnapshotAt).toBeNull();
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
  });

  it.each(preparation.records)('preserves exact preparation evidence for $candidateId', saved => {
    const report = reviewExpansionReleasePreflight(input);
    const row = report.rows.find(record => record.candidateId === saved.candidateId);
    expect(row?.preparationDescription).toBe(saved.preparationDescription);
    expect(row?.preparationSourceIds).toEqual(saved.preparationSourceIds);
    expect(row?.preparationEvidenceFile).toBe(thirdPlan.evidenceFile);
  });

  it('retains cover holds rather than inventing image URLs for five candidates', () => {
    const report = reviewExpansionReleasePreflight(input);
    const missing = thirdPlan.draftRows.filter(row => !row.proposedData.imageUrl);
    expect(missing).toHaveLength(5);
    for (const draft of missing) {
      const row = report.rows.find(record => record.candidateId === draft.candidateId);
      expect(row?.selectedCoverUrl).toBeNull();
      expect(row?.blockers).toContain('SELECTED_COVER_MISSING');
    }
  });

  it('does not merge Lokoloko into holy basil or invent a Philippine range', () => {
    const draft = thirdPlan.draftRows.find(row => row.proposedData.localName === 'Lokoloko');
    expect(draft?.proposedData.scientificName).toBe('Ocimum gratissimum');
    expect(draft?.proposedData.regionFound).toBeUndefined();
    expect(draft?.identityNotes.historicalMappingHeld).toBe(true);
    expect(draft?.reviewGaps.join(' ')).toContain('PRIMARY_HISTORICAL_IDENTITY_HOLD');
    expect(draft?.proposedSources.some(source => source.supports.includes('regionFound'))).toBe(false);
    expect(draft?.occurrenceReview.absenceClaimed).toBe(false);
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.localName === 'Lokoloko');
    expect(row?.blockers).toEqual(expect.arrayContaining(['REGION_UNRESOLVED', 'SECONDARY_SOURCE_IDENTITY_HELD']));
  });

  it('keeps the exact-species local botanical references instead of borrowing Kew country omissions', () => {
    for (const name of ['Romero', 'Bottle gourd', 'Luffa aegyptiaca']) {
      const draft = thirdPlan.draftRows.find(row => row.proposedData.localName === name);
      const occurrence = draft?.proposedSources.filter(source => source.supports.includes('regionFound'));
      expect(occurrence).toHaveLength(1);
      expect(occurrence?.[0]?.url).toContain('philippineplants.org');
      expect(draft?.occurrenceReview.absenceClaimed).toBe(false);
    }
  });

  it('keeps laboratory cooking separate from beginner guidance and every dose unapproved', () => {
    const kupang = thirdPlan.draftRows.find(row => row.proposedData.localName === 'Kupang');
    expect(kupang?.preparationReview.kind).toBe('LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD');
    expect(kupang?.proposedData.preparationMethod).toContain('not a home recipe or treatment');
    for (const draft of thirdPlan.draftRows) {
      expect(draft.proposedData.dosage).toContain('No medicinal dose is cleared');
      expect(draft.proposedData.reviewedById).toBeNull();
      expect(draft.preparationReview.beginnerStepsCleared).toBe(false);
      expect(draft.regionalNameReview.modernRegionalMappingCleared).toBe(false);
    }
  });

  it('preserves bottle-gourd and mature-loofah safety restrictions', () => {
    const bottle = thirdPlan.draftRows.find(row => row.proposedData.localName === 'Bottle gourd');
    expect(bottle?.proposedData.warnings).toContain('Discard bitter fruit');
    expect(bottle?.proposedData.warnings).toContain('urgent medical attention');
    expect(bottle?.proposedSources.find(source => source.id === 'icmr-2012-bottle-gourd-safety')?.supports).toContain('warnings');
    const loofah = thirdPlan.draftRows.find(row => row.proposedData.scientificName === 'Luffa aegyptiaca');
    expect(loofah?.proposedData.warnings).toContain('Mature fruit is fibrous, bitter and inedible');
  });

  it('rejects cover substitution even when the original candidate lacks a cover', () => {
    const changed = structuredClone(thirdPlan);
    const missing = changed.draftRows.find(row => !row.proposedData.imageUrl)!;
    missing.proposedData.imageUrl = 'https://example.com/other-species.jpg';
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/cover does not match/);
  });

  it('rejects a missing draft cover when a selected cover already exists in the audit', () => {
    const changed = structuredClone(thirdPlan);
    const selected = changed.draftRows.find(row => row.proposedData.imageUrl)!;
    delete selected.proposedData.imageUrl;
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/cover does not match/);
  });
});
