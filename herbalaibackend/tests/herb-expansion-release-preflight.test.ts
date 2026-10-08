import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const readJson = (relative: string) => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const input = {
  queue: readJson('../content/herbs/expansion-batch-03.review.json'),
  audit: readJson('../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  plan: readJson('../../Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  leads: readJson('../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  catalog: { checkedAt: '2026-10-06T16:09:24.056Z', total: 0, herbs: [] as {
    id: string; localName: string; scientificName: string; cebuanoName?: string;
  }[] },
};
type SecondDraftRow = {
  candidateId: string;
  proposedData: {
    localName: string; scientificName: string; regionFound?: string;
    imageUrl: string; dosage: string; reviewedById: null;
  };
  proposedSources: { id: string; supports: string[] }[];
  identityNotes: { acceptedNameProposal: string | null };
  preparationReview: { beginnerStepsCleared: boolean };
  occurrenceReview: { absenceClaimed: boolean };
};
const secondPlan = readJson('../../Docs/research/HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json');
const secondDraftRows: SecondDraftRow[] = secondPlan.draftRows;
const secondPreparation = readJson('../../Docs/research/HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json');
const combinedInput = { ...input, additionalPlans: [secondPlan] };

describe('held fifty-herb release preflight', () => {
  it.each([['--publish'], ['--stage'], ['--check-public', '--publish'], []].map(argumentsList => ({ argumentsList })))('rejects write modes and unsupported CLI arguments $argumentsList', ({ argumentsList }) => {
    const script = fileURLToPath(new URL('../prisma/check-herb-expansion-release.ts', import.meta.url));
    const result = spawnSync(process.execPath, ['--import', 'tsx', script, ...argumentsList], {
      encoding: 'utf8', timeout: 10_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('No write or publish mode exists');
  });

  it('derives all fifty blockers without promoting research to publication', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toEqual({ candidates: 50, livePublicHerbs: 0, fullContentDrafts: 10,
      draftPlansPresent: 10, partialContentDrafts: 0,
      missingFullContentDrafts: 40, missingSelectedCovers: 13, heldSecondaryIdentities: 2,
      publicIdentityConflicts: 0, publicationCleared: 0 });
    expect(report.publicationAllowed).toBe(false);
    expect(report.writeAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && row.blockers.length > 0)).toBe(true);
  });

  it('combines held batches with the repaired bounded Fennel cultivation evidence', () => {
    const report = reviewExpansionReleasePreflight(combinedInput);
    expect(report.counts).toMatchObject({ draftPlansPresent: 20, fullContentDrafts: 20,
      partialContentDrafts: 0, missingFullContentDrafts: 30, publicationCleared: 0 });
    const fennel = report.rows.find(row => row.localName === 'Fennel');
    expect(fennel?.draftPlanPresent).toBe(true);
    expect(fennel?.fullContentDraftPresent).toBe(true);
    expect(fennel?.blockers).not.toContain('REGION_UNRESOLVED');
    expect(secondDraftRows.find(row => row.proposedData.localName === 'Fennel')?.proposedData.regionFound)
      .toContain('cultivated, not naturalized');
    expect(fennel?.preparationEvidenceFile).toBe(secondPlan.evidenceFile);
    expect(report.draftEvidence[1]?.privateSnapshotAt).toBeNull();
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared)).toBe(true);
  });

  it('detects lost Fennel occurrence text rather than trusting assembled totals', () => {
    const changed = structuredClone(secondPlan);
    const fennel = changed.draftRows.find((row: SecondDraftRow) => row.proposedData.localName === 'Fennel');
    if (!fennel) throw new Error('Missing Fennel fixture.');
    delete fennel.proposedData.regionFound;
    const report = reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] });
    expect(report.counts).toMatchObject({ fullContentDrafts: 19, partialContentDrafts: 1 });
    expect(report.rows.find(row => row.localName === 'Fennel')?.blockers).toContain('REGION_UNRESOLVED');
  });

  it('preserves exactly the saved second-ten preparation rather than generating doses or steps', () => {
    const report = reviewExpansionReleasePreflight(combinedInput);
    for (const saved of secondPreparation.records) {
      const row = report.rows.find(record => record.candidateId === saved.candidateId);
      expect(row?.preparationDescription).toBe(saved.preparationDescription);
      expect(row?.preparationSourceIds).toEqual(saved.preparationSourceIds);
      expect(row?.selectedCoverUrl).toBe(secondDraftRows.find(record => record.candidateId === saved.candidateId)?.proposedData.imageUrl);
    }
  });

  it('keeps each second-ten identity source separate from evidence for medicinal safety', () => {
    for (const row of secondDraftRows) {
      expect(row.proposedSources.some(source => source.supports.includes('identity'))).toBe(true);
      const hasOccurrence = row.proposedSources.some(source => source.supports.includes('regionFound'));
      expect(hasOccurrence).toBe(Boolean(row.proposedData.regionFound));
      expect(row.proposedData.dosage).toContain('No medicinal dose is cleared');
      expect(row.proposedData.reviewedById).toBeNull();
      expect(row.preparationReview.beginnerStepsCleared).toBe(false);
      expect(row.occurrenceReview.absenceClaimed).toBe(false);
    }
    const radish = secondDraftRows.find(row => row.proposedData.localName === 'Radish');
    expect(radish?.identityNotes.acceptedNameProposal).toBe('Raphanus raphanistrum subsp. sativus');
    expect(radish?.proposedData.scientificName).toBe('Raphanus sativus');
    expect(radish?.proposedData.regionFound).toContain('January 2017');
    const cacao = secondDraftRows.find(row => row.proposedData.localName === 'Cacao');
    expect(cacao?.proposedSources.find(source => source.supports.includes('regionFound'))?.id).toBe('cacao-da-roadmap');
  });

  it('rejects duplicate candidates across otherwise valid plans', () => {
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [secondPlan, secondPlan] })).toThrow(/duplicate/);
  });

  it('rejects duplicate proposed record IDs across batches', () => {
    const changed = structuredClone(secondPlan);
    changed.draftRows[0].proposedData.id = input.plan.draftRows[0].proposedData.id;
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/duplicate proposed/);
  });

  it('rejects unidentifiable additional evidence instead of mislabelling it as the first ten', () => {
    const changed = structuredClone(secondPlan);
    delete changed.evidenceFile;
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow(/evidence file/);
  });

  it.each(['../OTHER.json', 'folder/OTHER.json', 'folder\\OTHER.json', '.json', 'OTHER.txt'])('rejects unsafe evidence filename %s', evidenceFile => {
    const changed = structuredClone(secondPlan);
    changed.evidenceFile = evidenceFile;
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow();
  });

  it('rejects a substituted cover and ambiguous duplicate source IDs', () => {
    const wrongCover = structuredClone(secondPlan);
    wrongCover.draftRows[0].proposedData.imageUrl = wrongCover.draftRows[1].proposedData.imageUrl;
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [wrongCover] })).toThrow(/cover does not match/);
    const duplicateSource = structuredClone(secondPlan);
    duplicateSource.draftRows[0].proposedSources.push(structuredClone(duplicateSource.draftRows[0].proposedSources[0]));
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [duplicateSource] })).toThrow(/duplicate source IDs/);
  });

  it.each(['wrongQueue', 'wrongTaxon', 'published', 'credentialUrl'])('rejects invalid additional-plan state: %s', mutation => {
    const changed = structuredClone(secondPlan);
    if (mutation === 'wrongQueue') changed.queueId = 'another-queue';
    if (mutation === 'wrongTaxon') changed.draftRows[0].proposedData.scientificName = 'Piper betle';
    if (mutation === 'published') changed.draftRows[0].proposedData.publicationStatus = 'PUBLISHED';
    if (mutation === 'credentialUrl') changed.draftRows[0].proposedSources[0].url = 'https://user:secret@example.com/source';
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: [changed] })).toThrow();
  });

  it('retains the later first-ten preparation and region repair rather than the old missing-field list', () => {
    const row = reviewExpansionReleasePreflight(input).rows.find(record => record.localName === 'Duhat');
    expect(row?.preparationDescription).toContain('Culinary use, not treatment');
    expect(row?.blockers).not.toContain('REGION_UNRESOLVED');
    expect(row?.blockers).toContain('CATEGORY_UNRESOLVED');
    expect(row?.earlierMissingFields).toEqual([]);
    expect(row?.draftReviewNotes.length).toBeGreaterThan(0);
  });

  it('does not count missing covers or taxon-mismatched secondary leads as cleared', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.rows.find(row => row.localName === 'Lokoloko')?.blockers)
      .toEqual(expect.arrayContaining(['SECONDARY_SOURCE_IDENTITY_HELD', 'SELECTED_COVER_MISSING']));
    expect(report.rows.find(row => row.localName === 'Manzanitas')?.blockers).toContain('SECONDARY_SOURCE_IDENTITY_HELD');
  });

  it('retains all fifty descriptive preparation records without inventing full content or recipe clearance', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.rows.every(row => row.preparationDescription.trim().length > 0 && !row.medicinalInstructionsCleared)).toBe(true);
    const mustard = report.rows.find(row => row.localName === 'Mustasa');
    expect(mustard?.preparationSourceIds).toContain('mustard-nparks');
    expect(mustard?.fullContentDraftPresent).toBe(false);
    expect(mustard?.blockers).toContain('FULL_CONTENT_DRAFT_MISSING');
  });

  it('detects public synonym conflicts without claiming a private all-state check', () => {
    const changed = structuredClone(input);
    changed.catalog.herbs.push({ id: 'existing', localName: 'Other', scientificName: 'Eugenia jambolana Lam.' });
    changed.catalog.total = 1;
    const report = reviewExpansionReleasePreflight(changed);
    expect(report.rows.find(row => row.localName === 'Duhat')?.blockers).toContain('PUBLIC_IDENTITY_CONFLICT');
    expect(report.publicCatalogOnly).toBe(true);
    expect(report.globalBlockers.join(' ')).toContain('all-state');
  });

  it.each(['audit', 'leads'] as const)('rejects duplicate %s rows', key => {
    const changed = structuredClone(input);
    const rows = key === 'audit' ? changed.audit.candidates : changed.leads.records;
    rows[1] = structuredClone(rows[0]);
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow(/duplicate/);
  });

  it.each(['audit', 'plan', 'leads'] as const)('rejects another queue in %s', key => {
    const changed = structuredClone(input);
    changed[key].queueId = 'another-queue';
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow(/another queue/);
  });

  it.each(['audit', 'plan', 'leads'] as const)('rejects forged publication clearance in %s', key => {
    const changed = structuredClone(input);
    changed[key].publicationAllowed = true;
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow();
  });

  it('rejects wrong-species draft data and credential-bearing cover URLs', () => {
    const wrong = structuredClone(input);
    wrong.plan.draftRows[0].proposedData.scientificName = 'Example species';
    expect(() => reviewExpansionReleasePreflight(wrong)).toThrow(/identity mismatch/);
    const unsafe = structuredClone(input);
    unsafe.audit.candidates[0].image.cloudinaryUrl = 'https://user:secret@example.com/cover.jpg';
    expect(() => reviewExpansionReleasePreflight(unsafe)).toThrow();
  });

  it('rejects truncated catalog results and newly invented reviewed draft flags', () => {
    expect(() => reviewExpansionReleasePreflight({ ...input, catalog: { ...input.catalog, total: 38 } })).toThrow(/all distinct/);
    const changed = structuredClone(input);
    changed.plan.draftRows[0].proposedData.isVerified = true;
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow();
  });
});
