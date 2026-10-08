import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const file = 'HERB_SANTAN_KABIKI_PREPARATION_FOLLOW_UP_2026-10-07.json';
const readJson = (name: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const sourceSchema = z.object({
  id: z.string(), scientificName: z.string().nullable().optional(), taxonScope: z.string().optional(),
  kind: z.string(), sourceStatus: z.string().optional(), url: z.url(), supports: z.array(z.string()),
  downloadBytes: z.number().int().positive().optional(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  voucher: z.string().optional(), experimentalModel: z.string().optional(),
}).passthrough();
const followUp = z.object({
  status: z.literal('PREPARATION_FOLLOW_UP_NOT_IMPORTABLE'), writeAllowed: z.literal(false),
  publicationAllowed: z.literal(false), stagingAllowed: z.literal(false), productionWritesPerformed: z.literal(false),
  sources: z.array(sourceSchema).length(3),
  retrievals: z.array(z.object({
    sourceId: z.string(), httpStatus: z.literal(200), rawOriginResponseObtained: z.literal(true), rawCopyCommitted: z.literal(false),
    printedPagesReviewed: z.array(z.number()).optional(),
  })).length(3),
  failedRetrievals: z.array(z.object({ url: z.url(), status: z.string() })),
  proposals: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), localName: z.string(), preparationKind: z.string(),
    preparationPart: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()).length(1),
    methodEstablishedInReview: z.literal(true), foodProcessingEstablished: z.literal(false),
    medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false),
  })).length(2),
}).parse(readJson(file));
const planSchema = z.object({
  preparationFollowUpFiles: z.array(z.string()),
  draftRows: z.array(z.object({
    candidateId: z.string(), preparationFollowUpFile: z.string().optional(), uncitedFields: z.array(z.string()),
    preparationReview: z.object({
      kind: z.string(), methodEstablishedInReview: z.boolean(), foodProcessingEstablished: z.boolean().optional(),
      medicinalInstructionsCleared: z.boolean(), beginnerStepsCleared: z.boolean(),
    }).passthrough(),
    proposedData: z.object({
      scientificName: z.string(), preparationMethod: z.string(), dosage: z.string(),
      publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
      isVerified: z.literal(false), isDohApproved: z.literal(false),
      reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
    }).passthrough(),
    proposedSources: z.array(sourceSchema),
  }).passthrough()),
}).passthrough();
const fourthPlan = planSchema.parse(readJson('HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const getDraft = (plan: typeof fourthPlan, candidateId: string) => {
  const draft = plan.draftRows.find(row => row.candidateId === candidateId);
  if (!draft) throw new Error('Missing follow-up draft.');
  return draft;
};
const input = {
  queue: JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')) as unknown,
  audit: readJson('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: ['SECOND', 'THIRD', 'FIFTH'].map(batch => readJson(`HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)),
  catalog: { checkedAt: '2026-10-07T01:00:00.000Z', total: 0, herbs: [] },
  mediaFollowUp: { manifest: readJson('HERB_COVER_INTEGRATION_2026-10-07.json'), review: readJson('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
};
const review = (plan = fourthPlan) => reviewExpansionReleasePreflight({ ...input, additionalPlans: [...input.additionalPlans, plan] });

describe('Santan and Kabiki source-bound descriptive follow-up', () => {
  it.each(followUp.proposals)('owns only the cited description for $localName', proposal => {
    const draft = getDraft(fourthPlan, proposal.candidateId);
    expect(fourthPlan.preparationFollowUpFiles).toContain(file);
    expect(draft.preparationFollowUpFile).toBe(file);
    expect(draft.proposedData.scientificName).toBe(proposal.scientificName);
    expect(draft.proposedData.preparationMethod).toBe(proposal.preparationDescription);
    const sources = draft.proposedSources.filter(source => source.supports.includes('preparationMethod'));
    expect(sources.map(source => source.id)).toEqual(proposal.preparationSourceIds);
    expect(sources.every(source => source.scientificName === proposal.scientificName && source.taxonScope === 'EXACT_SPECIES')).toBe(true);
    expect(draft.preparationReview).toMatchObject({ kind: proposal.preparationKind, methodEstablishedInReview: true,
      foodProcessingEstablished: false, medicinalInstructionsCleared: false, beginnerStepsCleared: false });
  });

  it('improves descriptive completeness without clearing publication or human use', () => {
    const report = review();
    expect(report.counts).toMatchObject({ fullContentDrafts: 49, partialContentDrafts: 1,
      missingSelectedCovers: 11, publicationCleared: 0 });
    expect(report.writeAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
    for (const proposal of followUp.proposals) {
      expect(report.rows.find(row => row.candidateId === proposal.candidateId)?.blockers).toEqual(
        expect.arrayContaining(['CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED', 'CATEGORY_UNRESOLVED']));
      expect(getDraft(fourthPlan, proposal.candidateId).proposedData.dosage).toContain('No medicinal dose is cleared');
    }
  });

  it('retains secondary folklore, shared-name and genus-only food boundaries for Santan', () => {
    const proposal = followUp.proposals.find(row => row.localName === 'Santan')!;
    const source = followUp.sources.find(row => row.id === proposal.preparationSourceIds[0])!;
    expect(source.kind).toBe('SECONDARY_TRADITIONAL_DESCRIPTION_HELD');
    expect(proposal.preparationPart).toContain('Roots');
    expect(proposal.preparationDescription).toContain('secondary folklore');
    const genus = getDraft(fourthPlan, proposal.candidateId).proposedSources.find(row => row.taxonScope === 'GENUS_ONLY')!;
    expect(genus.supports).toEqual(['researchGap']);
  });

  it('identifies authenticated bark and mice without converting methanol into a home ointment', () => {
    const proposal = followUp.proposals.find(row => row.localName === 'Kabiki')!;
    const source = followUp.sources.find(row => row.id === proposal.preparationSourceIds[0])!;
    expect(source.voucher).toBe('NBRI/CIF/Re./08/2008/32');
    expect(source.experimentalModel).toBe('Albino mice');
    expect(proposal.preparationDescription).toContain('methanol in a Soxhlet apparatus');
    expect(proposal.preparationDescription).toContain('mouse wound experiments');
    expect(proposal.preparationDescription).toContain('not a home recipe or treatment');
    expect(proposal.preparationDescription).not.toMatch(/rats|\d|percent|tablespoon|once daily|hours/i);
    expect(followUp.retrievals.find(row => row.sourceId === source.id)?.printedPagesReviewed).toEqual([98, 99]);
  });

  it('quarantines merged Kabiki/Bansalagin remedies and names as a research gap only', () => {
    const source = getDraft(fourthPlan, 'research-pardo-138').proposedSources.find(row => row.id === 'stuart-kabiki-merged-taxa-gap')!;
    expect(source.sourceStatus).toBe('QUARANTINED_MERGED_TAXA');
    expect(source.supports).toEqual(['researchGap']);
    const changed = structuredClone(fourthPlan);
    getDraft(changed, 'research-pardo-138').proposedSources.find(row => row.id === source.id)!.supports.push('preparationMethod');
    expect(() => review(changed)).toThrow('Quarantined evidence');
  });

  it('records actual origin retrievals without claiming blocked routes succeeded', () => {
    expect(followUp.sources.every(source => source.downloadBytes && source.downloadSha256)).toBe(true);
    expect(followUp.retrievals.map(row => row.sourceId).sort()).toEqual(followUp.sources.map(row => row.id).sort());
    expect(followUp.failedRetrievals.map(row => row.status)).toEqual([
      'HTTP_500_NOT_FULL_TEXT_VALIDATION', 'CAPTCHA_NO_FRESH_FULL_TEXT_VALIDATION',
      'WEB_SCREENSHOT_TIMEOUT_RAW_ORIGIN_AND_LOCAL_RENDER_USED_INSTEAD',
    ]);
  });

  it('preserves the historical fourth-ten preparation ledger unchanged', () => {
    const earlier = readFileSync(new URL('../../Docs/research/HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json', import.meta.url), 'utf8');
    expect(createHash('sha256').update(earlier.replace(/\r\n/g, '\n')).digest('hex'))
      .toBe('7098f83002993bb10203a33fb96cb322566ef03d8a10c410338580dbf410baa3');
  });

  it.each(followUp.proposals)('drops descriptive completeness when $localName loses its citation', proposal => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed, proposal.candidateId).proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!.supports = [];
    expect(review(changed).rows.find(row => row.candidateId === proposal.candidateId)?.fullContentDraftPresent).toBe(false);
  });

  it.each(followUp.proposals)('rejects a wrong source species for $localName', proposal => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed, proposal.candidateId).proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!.scientificName = 'Hibiscus sabdariffa';
    expect(() => review(changed)).toThrow('source species mismatch');
  });

  it.each(followUp.proposals)('rejects a duplicated source for $localName', proposal => {
    const changed = structuredClone(fourthPlan);
    const draft = getDraft(changed, proposal.candidateId);
    draft.proposedSources.push(structuredClone(draft.proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!));
    expect(() => review(changed)).toThrow('duplicate source IDs');
  });

  it.each(followUp.proposals)('rejects claiming medicinal clearance for $localName', proposal => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed, proposal.candidateId).preparationReview.medicinalInstructionsCleared = true;
    expect(() => review(changed)).toThrow();
  });
});
