import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const fourthPlan = z.object({
  evidenceFile: z.string(), snapshotCapturedAt: z.null(),
  draftRows: z.array(z.object({
    candidateId: z.string(), reviewGaps: z.array(z.string()), uncitedFields: z.array(z.string()),
    preparationReview: z.object({
      kind: z.string(), methodEstablishedInReview: z.boolean(),
      medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    }).passthrough(),
    proposedData: z.object({
      localName: z.string(), scientificName: z.string(), sourceScientificName: z.string(),
      preparationMethod: z.string(), dosage: z.string(), warnings: z.string(), regionFound: z.string(),
      imageUrl: z.string().optional(), reviewedById: z.null(), embedding: z.null(),
    }).passthrough(),
    proposedSources: z.array(z.object({
      id: z.string(), url: z.string(), supports: z.array(z.string()),
      scientificName: z.string().nullable().optional(), taxonScope: z.string().optional(),
    }).passthrough()),
  }).passthrough()).length(10),
}).passthrough().parse(readJson('../../Docs/research/HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const preparation = z.object({
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()),
  })),
}).parse(readJson('../../Docs/research/HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json'));
const followUp = z.object({ proposal: z.object({ candidateId: z.string(), preparationDescription: z.string(),
  preparationSourceIds: z.array(z.string()) }) }).parse(readJson('../../Docs/research/HERB_BALIBAGO_TKDL_FOLLOW_UP_2026-10-07.json'));
const nextFollowUp = z.object({ proposals: z.array(z.object({ candidateId: z.string(), preparationDescription: z.string(),
  preparationSourceIds: z.array(z.string()) })) }).parse(readJson('../../Docs/research/HERB_SANTAN_KABIKI_PREPARATION_FOLLOW_UP_2026-10-07.json'));
const overlays = [followUp.proposal, ...nextFollowUp.proposals];
const input = {
  queue: readJson('../content/herbs/expansion-batch-03.review.json'),
  audit: readJson('../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('../../Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: [readJson('../../Docs/research/HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'),
    readJson('../../Docs/research/HERB_THIRD_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'), fourthPlan],
  catalog: { checkedAt: '2026-10-07T00:00:00.000Z', total: 0, herbs: [] },
  mediaFollowUp: { manifest: readJson('../../Docs/research/HERB_COVER_INTEGRATION_2026-10-07.json'),
    review: readJson('../../Docs/research/HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
};

describe('fourth-ten held field drafts', () => {
  it('counts forty assembled plans without hiding method or occurrence gaps', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toMatchObject({ draftPlansPresent: 40, fullContentDrafts: 39,
      partialContentDrafts: 1, missingFullContentDrafts: 11, missingSelectedCovers: 11,
      heldSecondaryIdentities: 2, publicationCleared: 0 });
    expect(report.draftEvidence[3]?.privateSnapshotAt).toBeNull();
    expect(report.writeAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
  });

  it.each(preparation.records)('preserves exact species and preparation provenance for $candidateId', saved => {
    const draft = fourthPlan.draftRows.find(row => row.candidateId === saved.candidateId);
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.candidateId === saved.candidateId);
    expect(draft?.proposedData.scientificName).toBe(saved.scientificName);
    const expected = overlays.find(proposal => proposal.candidateId === saved.candidateId) ?? saved;
    expect(row?.preparationDescription).toBe(expected.preparationDescription);
    expect(row?.preparationSourceIds).toEqual(expected.preparationSourceIds);
    expect(row?.preparationEvidenceFile).toBe(fourthPlan.evidenceFile);
  });

  it.each(['Santan', 'Kabiki'])('counts only a held description, not medicinal or food clearance: %s', name => {
    const draft = fourthPlan.draftRows.find(row => row.proposedData.localName === name);
    expect(draft?.proposedData.regionFound.length).toBeGreaterThan(0);
    expect(draft?.proposedData.preparationMethod.length).toBeGreaterThan(0);
    expect(draft?.preparationReview.methodEstablishedInReview).toBe(true);
    expect(draft?.preparationReview.foodProcessingEstablished).toBe(false);
    expect(draft?.preparationReview.medicinalInstructionsCleared).toBe(false);
    expect(draft?.preparationReview.beginnerStepsCleared).toBe(false);
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.localName === name);
    expect(row?.fullContentDraftPresent).toBe(true);
    expect(row?.earlierMissingFields).toEqual([]);
    expect(row?.publicationAllowed).toBe(false);
    expect(row?.blockers).toEqual(expect.arrayContaining(['CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED', 'DRAFT_REVIEW_GAPS_OPEN']));
  });

  it('rejects relabelling a genus-only food lead as exact-species preparation evidence', () => {
    const changed = structuredClone(fourthPlan);
    const source = changed.draftRows.find(row => row.proposedData.localName === 'Santan')?.proposedSources.find(row => row.taxonScope === 'GENUS_ONLY');
    if (!source) throw new Error('Expected genus-level source fixture.');
    source.supports.push('preparationMethod');
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/Genus-only evidence/);
  });

  it('rejects a different source species rather than transferring its recipe', () => {
    const changed = structuredClone(fourthPlan);
    const source = changed.draftRows.find(row => row.proposedData.localName === 'Balibago')?.proposedSources.find(row => row.taxonScope === 'EXACT_SPECIES');
    if (!source) throw new Error('Expected exact-species source fixture.');
    source.scientificName = 'Hibiscus sabdariffa';
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/source species mismatch/);
  });

  it('does not clear methods just because citation or warning labels are edited', () => {
    const changed = structuredClone(fourthPlan);
    const draft = changed.draftRows.find(row => row.proposedData.localName === 'Kabiki');
    if (!draft) throw new Error('Expected Kabiki fixture.');
    draft.preparationReview.methodEstablishedInReview = false;
    draft.uncitedFields = [];
    draft.proposedSources[0]!.supports.push('preparationMethod');
    const report = reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] });
    expect(report.rows.find(row => row.localName === 'Kabiki')?.blockers).toContain('PREPARATION_METHOD_UNRESOLVED');
  });

  it('detects preparation evidence lost from an otherwise assembled field plan', () => {
    const changed = structuredClone(fourthPlan);
    const draft = changed.draftRows.find(row => row.proposedData.localName === 'Coffee');
    if (!draft) throw new Error('Expected Coffee fixture.');
    for (const source of draft.proposedSources) source.supports = source.supports.filter(tag => tag !== 'preparationMethod');
    const report = reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] });
    expect(report.rows.find(row => row.localName === 'Coffee')?.fullContentDraftPresent).toBe(false);
  });

  it('keeps manufacturing, methanol extraction and rat findings out of beginner guidance', () => {
    for (const name of ['Sampaguita', 'Kalumpang', 'Asana']) {
      const draft = fourthPlan.draftRows.find(row => row.proposedData.localName === name);
      expect(draft?.proposedData.preparationMethod).toContain('not a home recipe or treatment');
      expect(draft?.preparationReview.beginnerStepsCleared).toBe(false);
      expect(draft?.preparationReview.medicinalInstructionsCleared).toBe(false);
    }
  });

  it('preserves author-qualified Manzanitas identity and Doldol seed-oil caution', () => {
    const manzanitas = fourthPlan.draftRows.find(row => row.proposedData.localName === 'Manzanitas');
    expect(manzanitas?.proposedData.sourceScientificName).toContain('Lam.');
    expect(manzanitas?.proposedData.scientificName).toBe('Ziziphus mauritiana');
    expect(manzanitas?.reviewGaps.join(' ')).toContain('author-qualified');
    const doldol = fourthPlan.draftRows.find(row => row.proposedData.localName === 'Doldol');
    expect(doldol?.proposedData.warnings).toContain('discourages culinary seed oil');
    expect(doldol?.proposedSources.find(source => source.id === 'prota-ceiba-food-safety')?.supports).toContain('warnings');
  });

  it('retains two missing covers as holds without invented image URLs', () => {
    const missing = fourthPlan.draftRows.filter(row => !row.proposedData.imageUrl);
    expect(missing.map(row => row.proposedData.localName)).toEqual(['Balibago', 'Asana']);
    const report = reviewExpansionReleasePreflight(input);
    for (const draft of missing) {
      expect(report.rows.find(row => row.candidateId === draft.candidateId)?.blockers).toContain('SELECTED_COVER_MISSING');
    }
  });
});
