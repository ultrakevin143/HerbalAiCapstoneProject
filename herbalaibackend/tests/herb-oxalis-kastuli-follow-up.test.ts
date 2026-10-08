import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const file = 'HERB_OXALIS_KASTULI_PREPARATION_FOLLOW_UP_2026-10-07.json';
const readJson = (name: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const sourceSchema = z.object({
  id: z.string(), scientificName: z.string().optional(), taxonScope: z.string().optional(),
  supports: z.array(z.string()), url: z.url(), kind: z.string().optional(),
}).passthrough();
const followUp = z.object({
  status: z.literal('PREPARATION_FOLLOW_UP_NOT_IMPORTABLE'), writeAllowed: z.literal(false),
  stagingAllowed: z.literal(false), publicationAllowed: z.literal(false), productionWritesPerformed: z.literal(false),
  sources: z.array(sourceSchema.extend({
    kind: z.string(),
    downloadBytes: z.number().int().positive(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
    reviewCoverage: z.string(), fieldIdentifier: z.string().optional(), identifierIsVoucherAccession: z.boolean().optional(),
    reuseReview: z.string().optional(), materialProvenance: z.string().optional(), experimentalModel: z.string().optional(),
  })).length(2),
  retrievals: z.array(z.object({
    sourceId: z.string(), httpStatus: z.literal(200), rawOriginResponseObtained: z.literal(true),
    checkedAt: z.iso.datetime(), rawCopyCommitted: z.literal(false),
  })).length(2),
  proposals: z.array(z.object({
    candidateId: z.string(), localName: z.string(), scientificName: z.string(), preparationKind: z.string(),
    preparationPart: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()).length(1),
    methodEstablishedInReview: z.literal(true), foodProcessingEstablished: z.boolean(),
    foodSafetyCleared: z.literal(false), medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false),
  })).length(2),
  lokolokoReview: z.object({
    candidateId: z.literal('research-pardo-171'), scientificName: z.literal('Ocimum gratissimum'),
    status: z.literal('UNRESOLVED_NO_IDENTITY_OR_OCCURRENCE_CHANGE'), queueRenamed: z.literal(false),
    regionalNamesReassigned: z.literal(false), publicationAllowed: z.literal(false),
    identityReview: z.object({ rawOriginResponseObtained: z.literal(false), downloadBytes: z.null(), downloadSha256: z.null() }),
    occurrenceReview: z.object({ absenceClaimed: z.literal(false), rawOriginResponseObtained: z.literal(false),
      downloadBytes: z.null(), downloadSha256: z.null() }),
  }),
}).parse(readJson(file));
const fifthPlan = z.object({
  followUpEvidenceFiles: z.array(z.string()),
  draftRows: z.array(z.object({
    candidateId: z.string(), preparationFollowUpEvidenceFile: z.string().optional(),
    preparationReview: z.object({
      kind: z.string(), methodEstablishedInReview: z.boolean(), foodProcessingEstablished: z.boolean().optional(),
      foodSafetyCleared: z.boolean().optional(), medicinalInstructionsCleared: z.boolean(), beginnerStepsCleared: z.boolean(),
    }).passthrough(),
    proposedData: z.object({
      scientificName: z.string(), preparationMethod: z.string(), dosage: z.string(), warnings: z.string(),
      publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
      reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
      isVerified: z.literal(false), isDohApproved: z.literal(false),
    }).passthrough(),
    proposedSources: z.array(sourceSchema),
  }).passthrough()),
}).passthrough().parse(readJson('HERB_FIFTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const getDraft = (plan: typeof fifthPlan, candidateId: string) => {
  const draft = plan.draftRows.find(row => row.candidateId === candidateId);
  if (!draft) throw new Error('Missing source-bound draft.');
  return draft;
};
const input = {
  queue: JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')) as unknown,
  audit: readJson('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: ['SECOND', 'THIRD', 'FOURTH'].map(batch => readJson(`HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)),
  mediaFollowUp: { manifest: readJson('HERB_COVER_INTEGRATION_2026-10-07.json'), review: readJson('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
  catalog: { checkedAt: '2026-10-07T01:00:00.000Z', total: 0, herbs: [] },
};
const review = (plan = fifthPlan) => reviewExpansionReleasePreflight({ ...input, additionalPlans: [...input.additionalPlans, plan] });

describe('remaining source-bound preparation descriptions', () => {
  it.each(followUp.proposals)('binds only the new exact-species description for $localName', proposal => {
    const draft = getDraft(fifthPlan, proposal.candidateId);
    expect(fifthPlan.followUpEvidenceFiles).toContain(file);
    expect(draft.preparationFollowUpEvidenceFile).toBe(file);
    expect(draft.proposedData.preparationMethod).toBe(proposal.preparationDescription);
    expect(draft.proposedData.scientificName).toBe(proposal.scientificName);
    const sources = draft.proposedSources.filter(source => source.supports.includes('preparationMethod'));
    expect(sources.map(source => source.id)).toEqual(proposal.preparationSourceIds);
    expect(sources.every(source => source.scientificName === proposal.scientificName && source.taxonScope === 'EXACT_SPECIES')).toBe(true);
    expect(draft.preparationReview).toMatchObject({ kind: proposal.preparationKind, foodSafetyCleared: false,
      foodProcessingEstablished: proposal.foodProcessingEstablished, medicinalInstructionsCleared: false, beginnerStepsCleared: false });
  });

  it('keeps the one unresolved occurrence draft and all publication gates visible', () => {
    const report = review();
    expect(report.counts).toMatchObject({ fullContentDrafts: 49, partialContentDrafts: 1,
      missingSelectedCovers: 11, heldSecondaryIdentities: 2, publicationCleared: 0 });
    expect(report.rows.filter(row => !row.fullContentDraftPresent).map(row => row.localName)).toEqual(['Lokoloko']);
    expect(report.writeAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
  });

  it('distinguishes Ugandan food processing from validated oxalate removal or a Philippine recipe', () => {
    const proposal = followUp.proposals.find(row => row.localName === 'Oxalis corniculata')!;
    expect(proposal.preparationDescription).toContain('northern Uganda');
    expect(proposal.preparationDescription).toContain('parboiled');
    expect(proposal.preparationDescription).toContain('not a complete beginner recipe or treatment');
    expect(proposal.preparationDescription).toContain('does not establish a safe serving, validated oxalate removal');
    expect(getDraft(fifthPlan, proposal.candidateId).proposedData.warnings).toContain('No safe quantity');
    const source = followUp.sources.find(row => row.id === proposal.preparationSourceIds[0])!;
    expect(source.fieldIdentifier).toBe('SA45');
    expect(source.identifierIsVoucherAccession).toBe(false);
    expect(source.reuseReview).toContain('no-commercial-use assurance');
    expect(proposal.preparationDescription).not.toMatch(/groundnut|sesame|twice|\d|tablespoon|minutes|cures/i);
  });

  it('keeps separate Kastuli seed/leaf laboratory handling out of coffee and human guidance', () => {
    const proposal = followUp.proposals.find(row => row.localName === 'Kastuli')!;
    expect(proposal.preparationPart).toContain('separately');
    expect(proposal.preparationDescription).toContain('centrifuged');
    expect(proposal.preparationDescription).toContain('vacuum evaporator');
    expect(proposal.preparationDescription).toContain('not a home recipe or treatment');
    expect(proposal.preparationDescription).toContain('no coffee-flavouring process');
    const source = followUp.sources.find(row => row.id === proposal.preparationSourceIds[0])!;
    expect(source.experimentalModel).toBe('In vitro assays; not a human trial');
    expect(source.materialProvenance).toContain('no specimen voucher accession');
    expect(proposal.preparationDescription).not.toMatch(/\d|percent|rpm|hours|cures|daily dose/i);
  });

  it('preserves the earlier fifth-ten source ledger rather than rewriting failed method evidence', () => {
    const saved = readFileSync(new URL('../../Docs/research/HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json', import.meta.url), 'utf8');
    expect(createHash('sha256').update(saved.replace(/\r\n/g, '\n')).digest('hex'))
      .toBe('dd92ef08037f6961fe2e19459555fe5d18f23ad0e3f83af8f388f582f81f3d6e');
  });

  it('records successful XML retrieval without claiming fresh origin receipts for Lokoloko', () => {
    expect(followUp.retrievals.map(row => row.sourceId).sort()).toEqual(followUp.sources.map(row => row.id).sort());
    expect(followUp.lokolokoReview.occurrenceReview.absenceClaimed).toBe(false);
    expect(followUp.lokolokoReview.identityReview.downloadSha256).toBeNull();
    expect(followUp.lokolokoReview.occurrenceReview.rawOriginResponseObtained).toBe(false);
    expect(review().rows.find(row => row.localName === 'Lokoloko')?.blockers)
      .toEqual(expect.arrayContaining(['REGION_UNRESOLVED', 'SECONDARY_SOURCE_IDENTITY_HELD']));
  });

  it.each(followUp.proposals)('does not count the $localName method if its source support is lost', proposal => {
    const changed = structuredClone(fifthPlan);
    getDraft(changed, proposal.candidateId).proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!.supports = [];
    expect(review(changed).rows.find(row => row.candidateId === proposal.candidateId)?.fullContentDraftPresent).toBe(false);
  });

  it.each(followUp.proposals)('rejects source-species substitution for $localName', proposal => {
    const changed = structuredClone(fifthPlan);
    getDraft(changed, proposal.candidateId).proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!.scientificName = 'Abelmoschus esculentus';
    expect(() => review(changed)).toThrow('source species mismatch');
  });

  it.each(followUp.proposals)('rejects broadening $localName preparation evidence to a genus', proposal => {
    const changed = structuredClone(fifthPlan);
    getDraft(changed, proposal.candidateId).proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!.taxonScope = 'GENUS_ONLY';
    expect(() => review(changed)).toThrow('Genus-only evidence');
  });

  it.each(followUp.proposals)('rejects duplicate method-source ownership for $localName', proposal => {
    const changed = structuredClone(fifthPlan);
    const draft = getDraft(changed, proposal.candidateId);
    draft.proposedSources.push(structuredClone(draft.proposedSources.find(row => row.id === proposal.preparationSourceIds[0])!));
    expect(() => review(changed)).toThrow('duplicate source IDs');
  });

  it.each(followUp.proposals)('rejects unsupported medicinal clearance for $localName', proposal => {
    const changed = structuredClone(fifthPlan);
    getDraft(changed, proposal.candidateId).preparationReview.medicinalInstructionsCleared = true;
    expect(() => review(changed)).toThrow();
  });
});
