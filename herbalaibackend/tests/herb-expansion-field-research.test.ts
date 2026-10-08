import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planFirstTenDrafts } from '../src/content/herb-expansion-staging-plan.js';
import { mergeFieldResearchSources } from '../src/content/herb-expansion-field-research.js';

const readResearch = (name: string) => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const queue = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8'));
const review = readResearch('HERB_FIRST_TEN_REVIEW_2026-10-05.json');
const snapshot = readResearch('NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json');
const now = new Date(snapshot.capturedAt);
const research = {
  preparations: readResearch('HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json'),
  preparationOverlay: readResearch('TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json'),
  safetyOverlay: readResearch('TALISAY_BARK_SAFETY_FOLLOW_UP_2026-10-06.json'),
};
const plan = (fields: unknown = research) => planFirstTenDrafts(queue, review, snapshot, now, fields);

describe('first-ten preparation and safety fields in the read-only draft plan', () => {
  it('preserves every sourced food description instead of discarding it for a generic placeholder', () => {
    const result = plan();
    for (const row of result.draftRows) {
      const source = research.preparations.records.find((record: { candidateId: string }) => record.candidateId === row.candidateId);
      const expected = row.candidateId === research.preparationOverlay.proposal.candidateId
        ? research.preparationOverlay.proposal.proposedPreparationMethod : source.preparationDescription;
      expect(row.proposedData.preparationMethod).toBe(expected);
      expect(row.proposedSources.some(source => source.supports.includes('preparationMethod'))).toBe(true);
      expect(row.preparationReview).toMatchObject({ kind: 'FOOD_DESCRIPTION', medicinalInstructionsCleared: false });
      expect(row.proposedData.dosage).not.toMatch(/\d/);
    }
  });

  it('adds sourced animal-study limits for Talisay without clearing human safety or copying animal doses', () => {
    const row = plan().draftRows.find(draft => draft.candidateId === 'research-pardo-094');
    expect(row?.proposedData.warnings).toBe(research.safetyOverlay.proposal.proposedWarnings);
    expect(row?.modernEvidenceNote).toBe(research.safetyOverlay.proposal.proposedModernEvidenceNote);
    expect(row?.uncitedFields).toEqual([]);
    expect(row?.reviewGaps.join(' ')).toMatch(/Human bark and pregnancy safety remains unresolved/);
    expect(row?.proposedData.warnings).not.toMatch(/\d|safe for pregnancy/);
    expect(row?.proposedSources.filter(source => source.kind === 'PRECLINICAL_SAFETY').length).toBe(2);
    expect(row?.proposedData.medicinalUses).toContain(research.safetyOverlay.proposal.proposedModernEvidenceNote);
  });

  it('keeps modern evidence limitations inside the proposed persisted uses text with its actual source binding', () => {
    const duhat = plan().draftRows.find(row => row.candidateId === 'research-pardo-098');
    expect(duhat?.proposedData.medicinalUses).toMatch(/Evidence limits:.*did not reduce fasting glucose/);
    expect(duhat?.proposedSources.find(source => source.id === 'duhat-leaf-trial')?.supports).toEqual(expect.arrayContaining(['medicinalUses', 'evidenceReview', 'warnings']));
  });

  it('consolidates repeated source URLs while retaining the existing botanical and safety field bindings', () => {
    for (const row of plan().draftRows) {
      expect(new Set(row.proposedSources.map(source => source.url)).size).toBe(row.proposedSources.length);
      expect(row.proposedSources.some(source => source.supports.includes('imageIdentity'))).toBe(true);
      expect(row.proposedSources.some(source => source.supports.includes('medicinalUses'))).toBe(true);
    }
    const duhat = plan().draftRows.find(row => row.candidateId === 'research-pardo-098');
    expect(duhat?.proposedSources.find(source => source.id === 'duhat-nparks')?.supports).toEqual(expect.arrayContaining(['imageIdentity', 'preparationMethod']));
  });

  it('retains every publication, isolated-database and concurrent-write hold', () => {
    const result = plan();
    expect(result).toMatchObject({ writeAllowed: false, publicationAllowed: false, status: 'DRAFT_PLAN_NOT_EXECUTABLE' });
    expect(result.blockers.join(' ')).toMatch(/concurrent-write/);
    for (const row of result.draftRows) expect(row.proposedData).toMatchObject({ publicationStatus: 'DRAFT', isVerified: false, isDohApproved: false, evidenceClass: 'UNASSESSED', embedding: null });
  });

  it('does not mutate the queue, prior preparation checkpoint or unresolved original Talisay review', () => {
    const before = JSON.stringify({ queue, review, snapshot, research });
    plan();
    expect(JSON.stringify({ queue, review, snapshot, research })).toBe(before);
    expect(review.records.find((row: { candidateId: string }) => row.candidateId === 'research-pardo-094').safetySourceIds).toEqual([]);
  });

  it.each(['missing-candidate', 'wrong-species', 'missing-reference', 'duplicate-source', 'wrong-queue', 'publish', 'invented-dose', 'leaf-for-bark', 'credential-url'])(
    'rejects %s evidence instead of silently importing or overriding it', mutation => {
      const changed = structuredClone(research);
      if (mutation === 'missing-candidate') changed.preparations.records.pop();
      if (mutation === 'wrong-species') changed.preparations.records[0].scientificName = 'Example species';
      if (mutation === 'missing-reference') changed.preparations.records[0].preparationSourceIds = ['missing'];
      if (mutation === 'duplicate-source') changed.preparations.sources.push(changed.preparations.sources[0]);
      if (mutation === 'wrong-queue') changed.preparationOverlay.queueId = 'wrong';
      if (mutation === 'publish') changed.safetyOverlay.publicationAllowed = true;
      if (mutation === 'invented-dose') changed.safetyOverlay.proposal.dosage = 'Drink twice daily';
      if (mutation === 'leaf-for-bark') changed.safetyOverlay.sources[0].plantPart = 'LEAVES';
      if (mutation === 'credential-url') changed.preparations.sources[0].url = 'https://qa:fake@invalid.example/source';
      expect(() => plan(changed)).toThrow();
    },
  );

  it.each([';', '|'])('detects an existing all-state local alias separated with %s', separator => {
    const changed = structuredClone(snapshot);
    changed.rows.push(['Herb', 'alias-only', 'Other', 'Example species', '', `Unknown${separator}Lomboy`, 'HOLD', 'f']);
    changed.counts.Herb += 1;
    changed.displayedResultRowCount += 1;
    expect(planFirstTenDrafts(queue, review, changed, now, research).conflicts).toContainEqual({
      candidateId: 'research-pardo-098', recordId: 'Herb:alias-only', reasons: ['local name or alias'],
    });
  });

  it('merges source scopes and limitations without losing aliases or permitting an alias-ID overwrite', () => {
    const source = { id: 'original', kind: 'BOTANICAL_DESCRIPTION', title: 'Botanical source', url: 'https://invalid.example/source', limitation: 'Botanical scope only.', supports: ['imageIdentity'] };
    const alias = { ...source, id: 'alias', limitation: 'Food scope only.', supports: ['preparationMethod'] };
    const alternate = { ...alias, id: 'second-alias', limitation: 'Safety limits only.', supports: ['warnings'] };
    const before = JSON.stringify({ source, alias, alternate });
    const result = mergeFieldResearchSources([source], [alias, alternate, alias]);
    expect(result).toHaveLength(1);
    expect(result[0].supports).toEqual(['imageIdentity', 'preparationMethod', 'warnings']);
    expect(result[0].limitation).toBe('Botanical scope only. Food scope only. Safety limits only.');
    expect(() => mergeFieldResearchSources([source], [alias, { ...alias, url: 'https://invalid.example/replaced' }])).toThrow(/cannot override/);
    expect(JSON.stringify({ source, alias, alternate })).toBe(before);
  });
});
