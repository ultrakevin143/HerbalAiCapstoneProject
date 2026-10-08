import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (file: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${file}`, import.meta.url), 'utf8'));
const followUp = z.object({
  status: z.literal('PREPARATION_FOLLOW_UP_NOT_IMPORTABLE'), publicationAllowed: z.literal(false),
  productionWritesPerformed: z.literal(false), stagingAllowed: z.literal(false),
  source: z.object({ id: z.string(), scientificName: z.literal('Hibiscus tiliaceus'), taxonScope: z.literal('EXACT_SPECIES'),
    url: z.url(), supports: z.array(z.string()), reviewCoverage: z.literal('SPECIES_PART_METHOD_AND_LANGUAGE_FIELDS_FROM_WEB_EXTRACT') }),
  retrieval: z.object({ rawOriginResponseObtained: z.literal(false), downloadBytes: z.null(), downloadSha256: z.null(),
    reviewChannel: z.literal('WEB_TOOL_PAGE_EXTRACT'), originAttempt: z.object({ status: z.literal('RETRIEVAL_FAILED') }) }),
  proposal: z.object({ candidateId: z.literal('research-pardo-033'), scientificName: z.literal('Hibiscus tiliaceus'),
    preparationDescription: z.string(), preparationSourceIds: z.array(z.string()),
    preparationPart: z.string(), preparationKind: z.literal('TRADITIONAL_DESCRIPTION_HELD'), methodEstablishedInReview: z.literal(true),
    foodProcessingEstablished: z.literal(false), medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false) }),
  regionalNames: z.array(z.object({ name: z.string(), language: z.string(), context: z.string(), sourceId: z.string() })),
}).parse(readJson('HERB_BALIBAGO_TKDL_FOLLOW_UP_2026-10-07.json'));
const planSchema = z.object({
  draftRows: z.array(z.object({
    candidateId: z.string(), preparationFollowUpFile: z.string().optional(),
    preparationReview: z.object({ kind: z.string(), methodEstablishedInReview: z.boolean(),
      foodProcessingEstablished: z.boolean().optional(), medicinalInstructionsCleared: z.boolean(), beginnerStepsCleared: z.boolean() }).passthrough(),
    regionalNameReview: z.object({ modernRegionalMappingCleared: z.literal(false),
      followUpNames: z.array(z.object({ name: z.string(), language: z.string(), context: z.string(), sourceId: z.string() })).optional() }).passthrough(),
    proposedData: z.object({ preparationMethod: z.string(), scientificName: z.string(), dosage: z.string(),
      warnings: z.string(), imageUrl: z.string().optional(), cebuanoName: z.string().optional(), publicationStatus: z.string() }).passthrough(),
    proposedSources: z.array(z.object({ id: z.string(), scientificName: z.string().nullable().optional(), taxonScope: z.string().optional(),
      url: z.string(), supports: z.array(z.string()) }).passthrough()),
  }).passthrough()),
}).passthrough();
const fourthPlan = planSchema.parse(readJson('HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const getDraft = (plan: typeof fourthPlan) => {
  const draft = plan.draftRows.find(row => row.candidateId === followUp.proposal.candidateId);
  if (!draft) throw new Error('Missing Balibago field draft.');
  return draft;
};
const input = {
  queue: JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')) as unknown,
  audit: readJson('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: ['SECOND', 'THIRD', 'FIFTH'].map(batch => readJson(`HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)),
  mediaFollowUp: { manifest: readJson('HERB_COVER_INTEGRATION_2026-10-07.json'), review: readJson('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
  catalog: { checkedAt: '2026-10-07T01:00:00.000Z', total: 0, herbs: [] },
};
const review = (plan = fourthPlan) => reviewExpansionReleasePreflight({ ...input, additionalPlans: [...input.additionalPlans, plan] });

describe('Balibago context-bound TKDL traditional preparation', () => {
  it('binds the new description and citation without rewriting the earlier preparation ledger', () => {
    const draft = getDraft(fourthPlan);
    expect(draft.preparationFollowUpFile).toBe('HERB_BALIBAGO_TKDL_FOLLOW_UP_2026-10-07.json');
    expect(draft.proposedData.preparationMethod).toBe(followUp.proposal.preparationDescription);
    expect(draft.proposedSources.filter(source => source.supports.includes('preparationMethod')).map(source => source.id))
      .toEqual(followUp.proposal.preparationSourceIds);
    expect(draft.proposedSources.find(source => source.id === followUp.source.id)?.url).toBe(followUp.source.url);
    const earlier = z.object({ records: z.array(z.object({ candidateId: z.string(), preparationSourceIds: z.array(z.string()) }).passthrough()) })
      .parse(readJson('HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json'));
    expect(earlier.records.find(row => row.candidateId === followUp.proposal.candidateId)?.preparationSourceIds).toEqual([]);
  });

  it('counts a descriptive method without clearing safety, beginner instructions or publication', () => {
    const report = review();
    expect(report.counts).toMatchObject({ fullContentDrafts: 49, partialContentDrafts: 1, missingSelectedCovers: 11, publicationCleared: 0 });
    const row = report.rows.find(row => row.candidateId === followUp.proposal.candidateId);
    expect(row?.fullContentDraftPresent).toBe(true);
    expect(row?.publicationAllowed).toBe(false);
    expect(row?.blockers).toEqual(expect.arrayContaining(['CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED', 'SELECTED_COVER_MISSING']));
    expect(getDraft(fourthPlan).preparationReview).toMatchObject({ foodProcessingEstablished: false,
      medicinalInstructionsCleared: false, beginnerStepsCleared: false });
    expect(getDraft(fourthPlan).proposedData.dosage).toContain('No medicinal dose is cleared');
  });

  it('does not convert source oral quantities or harvesting beliefs into instructions', () => {
    expect(followUp.proposal.preparationDescription).not.toMatch(/\d|tablespoon|tbsp|palm.size|perpendicular|until.*resolved/i);
    expect(followUp.proposal.preparationDescription).toContain('not a safe home recipe or treatment');
    expect(followUp.proposal.preparationPart).toContain('inner bark');
    expect(followUp.proposal.dosage).toBeNull();
    expect(followUp.proposal.preparationInstructions).toBeNull();
  });

  it('keeps Tagabawa and Tagalog labels out of a generic Cebuano alias field', () => {
    expect(followUp.regionalNames.map(row => [row.name, row.language])).toEqual([['Luwago', 'Tagabawa'], ['Malabago', 'Tagalog']]);
    const draft = getDraft(fourthPlan);
    expect(draft.regionalNameReview.followUpNames).toEqual(followUp.regionalNames);
    expect(draft.proposedData.cebuanoName).toBeUndefined();
    expect(followUp.regionalNames.every(row => row.context && row.sourceId === followUp.source.id)).toBe(true);
  });

  it('does not manufacture a fresh origin response, hash or download receipt after a timeout', () => {
    expect(followUp.retrieval.rawOriginResponseObtained).toBe(false);
    expect(followUp.retrieval.downloadBytes).toBeNull();
    expect(followUp.retrieval.downloadSha256).toBeNull();
    expect(followUp.retrieval.originAttempt.status).toBe('RETRIEVAL_FAILED');
  });

  it('does not count the method if its supporting source tag is removed', () => {
    const changed = structuredClone(fourthPlan);
    const source = getDraft(changed).proposedSources.find(row => row.id === followUp.source.id)!;
    source.supports = source.supports.filter(field => field !== 'preparationMethod');
    expect(review(changed).rows.find(row => row.candidateId === followUp.proposal.candidateId)?.fullContentDraftPresent).toBe(false);
  });

  it.each(['Hibiscus sabdariffa', 'Thespesia populnea'])('rejects transferring a preparation from %s', scientificName => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed).proposedSources.find(row => row.id === followUp.source.id)!.scientificName = scientificName;
    expect(() => review(changed)).toThrow('source species mismatch');
  });

  it('rejects broadening the species evidence to a genus-level preparation', () => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed).proposedSources.find(row => row.id === followUp.source.id)!.taxonScope = 'GENUS_ONLY';
    expect(() => review(changed)).toThrow('Genus-only evidence');
  });

  it('rejects duplicate citation ownership', () => {
    const changed = structuredClone(fourthPlan);
    const source = getDraft(changed).proposedSources.find(row => row.id === followUp.source.id)!;
    getDraft(changed).proposedSources.push(structuredClone(source));
    expect(() => review(changed)).toThrow('duplicate source IDs');
  });

  it('rejects claiming medicinal clearance for the traditional report', () => {
    const changed = structuredClone(fourthPlan);
    getDraft(changed).preparationReview.medicinalInstructionsCleared = true;
    expect(() => review(changed)).toThrow();
  });
});
