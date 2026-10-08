import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const fifthPlan = z.object({
  evidenceFile: z.string(), snapshotCapturedAt: z.null(),
  draftRows: z.array(z.object({
    candidateId: z.string(), book: z.object({ heading: z.string(), commonNames: z.string() }).passthrough(),
    reviewGaps: z.array(z.string()), uncitedFields: z.array(z.string()),
    identityNotes: z.object({ queueRenamed: z.literal(false), historicalMappingHeld: z.boolean() }).passthrough(),
    regionalNameReview: z.object({ sourceText: z.string(), modernRegionalMappingCleared: z.literal(false) }),
    preparationReview: z.object({
      kind: z.string(), plantPart: z.string(), methodEstablishedInReview: z.boolean(),
      medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    }),
    proposedData: z.object({
      localName: z.string(), scientificName: z.string(), sourceScientificName: z.string(),
      preparationMethod: z.string(), dosage: z.string(), warnings: z.string(), regionFound: z.string(),
      imageUrl: z.string().optional(), reviewedById: z.null(), embedding: z.null(),
    }).passthrough(),
    proposedSources: z.array(z.object({
      id: z.string(), url: z.string(), supports: z.array(z.string()), sourceStatus: z.string().optional(),
      scientificName: z.string().optional(), reviewedAt: z.string(),
    }).passthrough()),
  }).passthrough()).length(10),
}).passthrough().parse(readJson('../../Docs/research/HERB_FIFTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json'));
const preparation = z.object({
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()),
    safetySourceIds: z.array(z.string()),
  })),
}).parse(readJson('../../Docs/research/HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json'));
const followUp = z.object({
  status: z.literal('PREPARATION_FOLLOW_UP_NOT_IMPORTABLE'), publicationAllowed: z.literal(false),
  stagingAllowed: z.literal(false), productionWritesPerformed: z.literal(false),
  synonymBinding: z.object({ acceptedScientificName: z.literal('Magnolia champaca'),
    sourceScientificName: z.literal('Michelia champaca'), relationship: z.literal('HOMOTYPIC_SYNONYM'),
    sourceUrl: z.url(), queueRenamed: z.literal(false) }),
  source: z.object({ id: z.string(), scientificName: z.string(), sourceScientificName: z.string(),
    downloadBytes: z.number().positive(), downloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
    reviewCoverage: z.literal('FULL_TEXT_METHOD_SECTIONS_READ'), supports: z.array(z.literal('preparationMethod')) }),
  proposal: z.object({ candidateId: z.string(), scientificName: z.string(), preparationDescription: z.string(),
    preparationSourceIds: z.array(z.string()), preparationKind: z.literal('LABORATORY_DESCRIPTION_HELD'),
    preparationPart: z.string(), methodEstablishedInReview: z.literal(true),
    medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
    preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false) }),
  quarantine: z.object({ unchanged: z.literal(true), supports: z.array(z.literal('researchGap')),
    retractionStatusConfirmed: z.literal(false), independentStudyDoesNotResolveNoticeMismatch: z.literal(true) }),
}).parse(readJson('../../Docs/research/HERB_TSAMPAKA_PREPARATION_FOLLOW_UP_2026-10-07.json'));
const earlierPlans = [
  'HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
  'HERB_THIRD_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
  'HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
].map(file => readJson(`../../Docs/research/${file}`));
const processingFollowUp = z.object({ proposals: z.array(z.object({ candidateId: z.string(), preparationDescription: z.string(),
  preparationSourceIds: z.array(z.string()) })) }).parse(readJson('../../Docs/research/HERB_OXALIS_KASTULI_PREPARATION_FOLLOW_UP_2026-10-07.json'));
const overlays = [followUp.proposal, ...processingFollowUp.proposals];
const input = {
  queue: readJson('../content/herbs/expansion-batch-03.review.json'),
  audit: readJson('../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('../../Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  additionalPlans: [...earlierPlans, fifthPlan],
  catalog: { checkedAt: '2026-10-07T00:00:00.000Z', total: 0, herbs: [] },
  mediaFollowUp: { manifest: readJson('../../Docs/research/HERB_COVER_INTEGRATION_2026-10-07.json'),
    review: readJson('../../Docs/research/HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
};
const getDraft = (name: string) => {
  const draft = fifthPlan.draftRows.find(row => row.proposedData.localName === name);
  if (!draft) throw new Error(`Missing fifth-ten fixture: ${name}`);
  return draft;
};

describe('final ten held field drafts', () => {
  it('assembles fifty plans without hiding the partial identity/occurrence draft or eleven missing covers', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toMatchObject({ draftPlansPresent: 50, fullContentDrafts: 49,
      partialContentDrafts: 1, missingFullContentDrafts: 1, missingSelectedCovers: 11,
      heldSecondaryIdentities: 2, publicationCleared: 0 });
    expect(report.draftEvidence[4]?.privateSnapshotAt).toBeNull();
    expect(report.writeAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
  });

  it('records source-to-identity mappings for every assembled plan without implying approval', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.rows.every(row => !row.blockers.includes('SOURCE_TAG_REVIEW:identity'))).toBe(true);
    expect(report.rows.every(row => row.blockers.includes('IDENTITY_REVIEW_PENDING'))).toBe(true);
  });

  it.each(preparation.records)('retains exact preparation and warning provenance for $candidateId', saved => {
    const expected = overlays.find(proposal => proposal.candidateId === saved.candidateId) ?? saved;
    const draft = fifthPlan.draftRows.find(row => row.candidateId === saved.candidateId);
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.candidateId === saved.candidateId);
    expect(draft?.proposedData.scientificName).toBe(saved.scientificName);
    expect(row?.preparationDescription).toBe(expected.preparationDescription);
    expect(row?.preparationSourceIds).toEqual(expected.preparationSourceIds);
    expect(row?.preparationEvidenceFile).toBe(fifthPlan.evidenceFile);
    expect(draft?.proposedSources.filter(source => source.supports.includes('warnings')).map(source => source.id)).toEqual(saved.safetySourceIds);
  });

  it.each(['Oxalis corniculata', 'Kastuli'])('counts a source-bound description without clearing human use: %s', name => {
    const draft = getDraft(name);
    expect(draft.preparationReview.methodEstablishedInReview).toBe(true);
    expect(draft.preparationReview.medicinalInstructionsCleared).toBe(false);
    expect(draft.preparationReview.beginnerStepsCleared).toBe(false);
    expect(draft.proposedData.preparationMethod.length).toBeGreaterThan(0);
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.localName === name);
    expect(row?.fullContentDraftPresent).toBe(true);
    expect(row?.publicationAllowed).toBe(false);
    expect(row?.blockers).toEqual(expect.arrayContaining(['CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED', 'DRAFT_REVIEW_GAPS_OPEN']));
  });

  it('binds only the independent flower-bud laboratory description without clearing clinical or beginner use', () => {
    const draft = getDraft('Tsampaka');
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.candidateId === followUp.proposal.candidateId);
    expect(draft.preparationFollowUpEvidenceFile).toBe('HERB_TSAMPAKA_PREPARATION_FOLLOW_UP_2026-10-07.json');
    expect(draft.preparationReview).toEqual({ plantPart: followUp.proposal.preparationPart,
      kind: followUp.proposal.preparationKind, methodEstablishedInReview: true,
      medicinalInstructionsCleared: false, beginnerStepsCleared: false });
    expect(draft.proposedSources.find(source => source.id === followUp.source.id)).toMatchObject(followUp.source);
    expect(row?.preparationSourceIds).toEqual([followUp.source.id]);
    expect(row?.fullContentDraftPresent).toBe(true);
    expect(row?.publicationAllowed).toBe(false);
    expect(draft.proposedData.preparationMethod).toContain('flower buds');
    expect(draft.proposedData.preparationMethod).toContain('Wistar-rat');
    expect(draft.proposedData.preparationMethod).toContain('not a home recipe or treatment');
    expect(draft.proposedData.preparationMethod).not.toMatch(/\d|daily dose|times per day|cures/);
    expect(draft.proposedData.warnings).toContain('safety remain uncleared');
    expect(draft.identityNotes.queueRenamed).toBe(false);
    expect(followUp.synonymBinding.sourceUrl).toContain('554657-1');
  });

  it.each(['preparationMethod', 'warnings', 'medicinalUses', 'identity'])('rejects quarantined evidence tagged as %s', field => {
    const changed = structuredClone(fifthPlan);
    const source = changed.draftRows.find(row => row.proposedData.localName === 'Tsampaka')?.proposedSources
      .find(row => row.sourceStatus === 'QUARANTINED_METADATA_MISMATCH');
    if (!source) throw new Error('Missing quarantined fixture.');
    source.supports.push(field);
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/Quarantined evidence/);
  });

  it('keeps an explicit method gap even if citation tags and kind are edited', () => {
    const changed = structuredClone(fifthPlan);
    const draft = changed.draftRows.find(row => row.proposedData.localName === 'Kastuli');
    if (!draft) throw new Error('Missing Kastuli fixture.');
    draft.preparationReview.methodEstablishedInReview = false;
    draft.preparationReview.kind = 'FOOD_DESCRIPTION';
    draft.uncitedFields = [];
    draft.proposedSources[0]!.supports.push('preparationMethod');
    const report = reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] });
    expect(report.rows.find(row => row.localName === 'Kastuli')?.fullContentDraftPresent).toBe(false);
  });

  it('keeps the Magnolia notice mismatch uncertain rather than alleging retraction', () => {
    const draft = getDraft('Tsampaka');
    const source = draft.proposedSources.find(row => row.sourceStatus === 'QUARANTINED_METADATA_MISMATCH');
    expect(source?.supports).toEqual(['researchGap']);
    expect(draft.proposedData.preparationMethod).toContain('not a confirmed retraction finding');
    expect(draft.proposedData.warnings).toContain('retraction status is not confirmed');
  });

  it('preserves renal risk, noni uncertainty and food-versus-supplement boundaries', () => {
    expect(getDraft('Kamias').proposedData.warnings).toContain("Cooking's effect on nephrotoxicity remains unresolved");
    expect(getDraft('Balimbing').proposedData.warnings).toContain('No safe serving');
    expect(getDraft('Bankundo').proposedData.warnings).toContain('uncertain causation');
    expect(getDraft('Bankundo').proposedData.warnings).toContain('potassium');
    expect(getDraft('Kahel').proposedData.warnings).toContain('mixed-product event reports do not establish causation');
  });

  it('preserves hybrid and cryptogenic uncertainty without a queue rename', () => {
    const orange = getDraft('Kahel');
    expect(orange.proposedData.scientificName).toBe('Citrus aurantium');
    expect(orange.proposedData.sourceScientificName).toBe('Citrus Bigaradia');
    expect(orange.identityNotes.historicalMappingHeld).toBe(true);
    expect(orange.reviewGaps.join(' ')).toContain('PRIMARY_HISTORICAL_IDENTITY_HOLD');
    expect(orange.proposedData.regionFound).toContain('Citrus × aurantium');
    expect(getDraft('Oxalis corniculata').proposedData.regionFound).toContain('cryptogenic');
  });

  it('keeps preclinical plant parts and all beginner instructions uncleared', () => {
    expect(getDraft('Abutilon indicum').preparationReview.plantPart).toContain('Combined leaves, twigs and roots');
    expect(getDraft('Ayapana').preparationReview.plantPart).toContain('leaf/stem mash');
    expect(getDraft('Kasuy').proposedData.preparationMethod).toContain('does not supply nut-shell processing');
    for (const draft of fifthPlan.draftRows) {
      expect(draft.preparationReview.beginnerStepsCleared).toBe(false);
      expect(draft.proposedData.dosage).toContain('No medicinal dose is cleared');
      expect(draft.regionalNameReview.sourceText).toBe(draft.book.commonNames);
      expect(draft.regionalNameReview.modernRegionalMappingCleared).toBe(false);
    }
  });

  it('retains four cover holds and separates fresh observations from earlier provenance', () => {
    expect(fifthPlan.draftRows.filter(row => !row.proposedData.imageUrl).map(row => row.proposedData.localName))
      .toEqual(['Kamias', 'Kahel', 'Kastuli', 'Ayapana']);
    expect(getDraft('Bankundo').proposedSources.find(source => source.id === 'nccih-noni-safety')?.reviewedAt).toBe('2026-10-07');
    expect(getDraft('Kamias').proposedSources.find(source => source.id === 'nair-2014-bilimbi-safety')?.reviewedAt).toBe('2026-10-06');
    const report = reviewExpansionReleasePreflight(input);
    for (const draft of fifthPlan.draftRows.filter(row => !row.proposedData.imageUrl)) {
      expect(report.rows.find(row => row.candidateId === draft.candidateId)?.blockers).toContain('SELECTED_COVER_MISSING');
    }
  });
});
