import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planFirstTenDrafts } from '../src/content/herb-expansion-staging-plan.js';

const readResearch = (name: string) => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const queue = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8'));
const review = readResearch('HERB_FIRST_TEN_REVIEW_2026-10-05.json');
const snapshot = readResearch('NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json');
const research = {
  preparations: readResearch('HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json'),
  preparationOverlay: readResearch('TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json'),
  safetyOverlay: readResearch('TALISAY_BARK_SAFETY_FOLLOW_UP_2026-10-06.json'),
  occurrence: readResearch('HERB_FIRST_TEN_OCCURRENCE_REVIEW_2026-10-06.json'),
};
const plan = (fields: unknown = research) => planFirstTenDrafts(queue, review, snapshot, new Date(snapshot.capturedAt), fields);

describe('first-ten bounded occurrence fields in the read-only draft plan', () => {
  it('keeps the saved CLI output consistent with the held ledgers and visible stale-snapshot blockers', () => {
    const saved = readResearch('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json');
    const reproduced = planFirstTenDrafts(queue, review, snapshot, new Date(saved.auditedAt), research);
    expect(saved).toEqual(reproduced);
    expect(saved.blockers.join(' ')).toMatch(/older than one hour/);
    expect(saved.blockers.join(' ')).toMatch(/concurrent-write/);
  });

  it('maps all ten reviewed region texts and exact botanical source bindings', () => {
    const result = plan();
    expect(result.draftRows).toHaveLength(10);
    for (const row of result.draftRows) {
      const record = research.occurrence.records.find((record: { candidateId: string }) => record.candidateId === row.candidateId);
      expect(row.proposedData).toHaveProperty('regionFound', record.proposedRegionFound);
      expect(row).toHaveProperty('occurrenceReview', { geographicScope: record.geographicScope });
      expect(row.proposedSources.some(source => source.supports.includes('regionFound'))).toBe(true);
      expect(row.proposedData).toMatchObject({ publicationStatus: 'DRAFT', evidenceClass: 'UNASSESSED', embedding: null, isVerified: false });
      expect(row.proposedSources.filter(source => source.supports.includes('regionFound')).map(source => source.url))
        .toEqual(record.occurrenceSourceIds.map((sourceId: string) => research.occurrence.sources.find((source: { id: string }) => source.id === sourceId).url));
    }
    expect(result).toMatchObject({ publicationAllowed: false, writeAllowed: false });
  });

  it('does not turn national introduced records into native or province-wide occurrence claims', () => {
    for (const candidateId of ['research-pardo-098', 'research-pardo-077']) {
      const row = plan().draftRows.find(draft => draft.candidateId === candidateId)!;
      expect(row.proposedData).toHaveProperty('regionFound', expect.stringContaining('introduced'));
      expect(row).toHaveProperty('occurrenceReview', { geographicScope: 'COUNTRY_ONLY' });
    }
    expect(research.occurrence.records.every((record: { proposedRegionFound: string }) => !/throughout all provinces|found everywhere/i.test(record.proposedRegionFound))).toBe(true);
  });

  it('keeps pooled study-area, naturalized Palawan and cultivated Los Baños records distinct', () => {
    const rows = plan().draftRows;
    for (const candidateId of ['research-pardo-069', 'research-pardo-063', 'research-pardo-104']) {
      const row = rows.find(draft => draft.candidateId === candidateId)!;
      expect(row).toHaveProperty('occurrenceReview', { geographicScope: 'STUDY_AREA' });
      expect(row.proposedData).toHaveProperty('regionFound', expect.stringContaining('does not establish occurrence at every study site'));
      expect(row.proposedSources.find(source => source.url === 'https://doi.org/10.1186/s13002-020-00363-7')?.supports)
        .toEqual(expect.arrayContaining(['regionFound', 'medicinalUses']));
    }
    expect(rows.find(row => row.candidateId === 'research-pardo-005')?.proposedData)
      .toHaveProperty('regionFound', expect.stringContaining('Palawan'));
    expect(rows.find(row => row.candidateId === 'research-pardo-102')?.proposedData)
      .toHaveProperty('regionFound', expect.stringContaining('cultivated in commercial nurseries'));
  });

  it('leaves absent occurrence research explicit without inventing a region or changing historical inputs', () => {
    const before = JSON.stringify({ queue, review, snapshot, research });
    const { occurrence, ...priorResearch } = research;
    expect(occurrence.records).toHaveLength(10);
    for (const row of plan(priorResearch).draftRows) {
      expect(row.proposedData).not.toHaveProperty('regionFound');
      expect(row).toHaveProperty('occurrenceReview', null);
      expect(row.reviewGaps.join(' ')).toMatch(/Occurrence\/region field has not been reviewed/);
    }
    plan();
    expect(JSON.stringify({ queue, review, snapshot, research })).toBe(before);
  });

  it.each([
    'missing-record', 'duplicate-record', 'wrong-species', 'wrong-name', 'wrong-page', 'wrong-queue',
    'missing-source', 'duplicate-source', 'cross-species-source', 'changed-region', 'expanded-scope',
    'wrong-field', 'credential-url', 'publication', 'staging', 'production-write',
    'duplicate-reference', 'duplicate-claim', 'unreviewed-claim-species', 'changed-source-scope', 'row-publication',
  ])('rejects %s occurrence evidence before generating a draft', mutation => {
    const changed = structuredClone(research);
    const ledger = changed.occurrence;
    if (mutation === 'missing-record') ledger.records.pop();
    if (mutation === 'duplicate-record') ledger.records[1] = ledger.records[0];
    if (mutation === 'wrong-species') ledger.records[0].scientificName = 'Example species';
    if (mutation === 'wrong-name') ledger.records[0].localName = 'Other';
    if (mutation === 'wrong-page') ledger.records[0].printedPage += 1;
    if (mutation === 'wrong-queue') ledger.queueId = 'wrong';
    if (mutation === 'missing-source') ledger.records[0].occurrenceSourceIds = ['missing'];
    if (mutation === 'duplicate-source') ledger.sources.push(ledger.sources[0]);
    if (mutation === 'cross-species-source') ledger.records[0].occurrenceSourceIds = [ledger.sources[1].id];
    if (mutation === 'changed-region') ledger.records[0].proposedRegionFound = 'Found everywhere in the Philippines.';
    if (mutation === 'expanded-scope') ledger.records[0].geographicScope = 'SPECIFIC_LOCALITY';
    if (mutation === 'wrong-field') ledger.sources[0].supports = ['dosage'];
    if (mutation === 'credential-url') ledger.sources[0].url = 'https://qa:fake@invalid.example/source';
    if (mutation === 'publication') ledger.publicationAllowed = true;
    if (mutation === 'staging') ledger.stagingAllowed = true;
    if (mutation === 'production-write') ledger.productionWritesPerformed = true;
    if (mutation === 'duplicate-reference') ledger.records[0].occurrenceSourceIds.push(ledger.records[0].occurrenceSourceIds[0]);
    if (mutation === 'duplicate-claim') ledger.sources[0].claims.push(ledger.sources[0].claims[0]);
    if (mutation === 'unreviewed-claim-species') ledger.sources[0].claims[0].scientificName = 'Example species';
    if (mutation === 'changed-source-scope') ledger.sources[0].claims[0].geographicScope = 'STUDY_AREA';
    if (mutation === 'row-publication') ledger.records[0].publicationAllowed = true;
    expect(() => plan(changed)).toThrow();
  });
});
