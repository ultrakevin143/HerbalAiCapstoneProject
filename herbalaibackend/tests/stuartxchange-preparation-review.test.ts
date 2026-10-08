import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { expansionQueueSchema } from '../src/content/herb-expansion-review.js';

const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const queue = expansionQueueSchema.parse(readJson('../content/herbs/expansion-batch-03.review.json'));
const review = z.object({
  schemaVersion: z.literal(1), queueId: z.string(), researchOnly: z.literal(true),
  status: z.literal('SECONDARY_SOURCE_DISCOVERY_NOT_RELEASE_MANIFEST'),
  productionWritesPerformed: z.literal(false), uploadsPerformed: z.literal(false), publicationAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()),
  publicObservation: z.object({ scope: z.string(), publishedRecordsReturned: z.number(), blankPreparationMethod: z.number() }),
  previouslyMissingMethodCandidatesWithNewSecondaryLeads: z.array(z.string()).length(4),
  primaryChecks: z.array(z.object({ id: z.string(), url: z.url(), supports: z.array(z.string()), finding: z.string() })),
  copyright: z.object({ mirroredText: z.literal(false), imagesCopied: z.literal(false), endorsementClaimed: z.literal(false) }),
  records: z.array(z.object({
    candidateId: z.string(), batch: z.number(), localName: z.string(), scientificName: z.string(), sourceUrl: z.url(),
    identityStatus: z.enum(['SOURCE_TAXON_LOCATED_PENDING_REVIEW', 'SOURCE_TAXON_MISMATCH']),
    sourceTaxon: z.string(), preparationLead: z.string().min(20).nullable(), reviewNote: z.string().min(40),
    medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false), publicationAllowed: z.literal(false),
  })).length(50),
}).parse(readJson('../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'));

const findRecord = (scientificName: string) => {
  const record = review.records.find(candidate => candidate.scientificName === scientificName);
  if (!record) throw new Error(`Missing reviewed taxon: ${scientificName}`);
  return record;
};

describe('StuartXchange preparation discovery ledger', () => {
  it('accounts for every queued identity exactly once', () => {
    expect(review.queueId).toBe(queue.batchId);
    expect(new Set(review.records.map(record => record.candidateId)).size).toBe(50);
    expect(review.records.map(record => record.candidateId).sort()).toEqual(queue.candidates.map(candidate => candidate.id).sort());
    for (const candidate of queue.candidates) {
      expect(findRecord(candidate.scientificName)).toMatchObject({
        candidateId: candidate.id, batch: candidate.batch, localName: candidate.proposedLocalName,
      });
    }
  });

  it('derives discovery counts without equating them with publication', () => {
    const located = review.records.filter(record => record.identityStatus === 'SOURCE_TAXON_LOCATED_PENDING_REVIEW');
    const held = review.records.filter(record => record.identityStatus === 'SOURCE_TAXON_MISMATCH');
    expect(review.counts).toEqual({
      queueCandidates: review.records.length, sourceTaxonLeadsLocated: located.length,
      sourceTaxonMismatchesHeld: held.length, preparationLeadsLocated: located.filter(record => record.preparationLead).length,
      medicinalInstructionsCleared: 0, publicationCleared: 0,
    });
    expect(located).toHaveLength(48);
    expect(held).toHaveLength(2);
    for (const record of located) expect(record.sourceTaxon).toBe(record.scientificName);
    for (const record of held) expect(record.preparationLead).toBeNull();
  });

  it('keeps different-species common-name pages out of selected preparation leads', () => {
    for (const [scientificName, path] of [
      ['Clitoria ternatea', 'Pukingan'], ['Piliostigma malabaricum', 'Alambangbang.html'],
      ['Parkia timoriana', 'Kopag'], ['Cocos nucifera', 'Niyog2'], ['Luffa aegyptiaca', 'PatolangBilog.html'],
    ]) expect(findRecord(scientificName).sourceUrl).toBe(`https://www.stuartxchange.org/${path}`);
  });

  it('holds author-qualified jujube and basil mismatches instead of merging aliases', () => {
    expect(findRecord('Ziziphus mauritiana')).toMatchObject({
      identityStatus: 'SOURCE_TAXON_MISMATCH', sourceTaxon: 'Ziziphus jujuba Mill.', preparationLead: null,
    });
    expect(findRecord('Ocimum gratissimum')).toMatchObject({
      identityStatus: 'SOURCE_TAXON_MISMATCH', sourceTaxon: 'Leptospermum polygalifolium', preparationLead: null,
    });
    expect(findRecord('Ocimum tenuiflorum').sourceUrl).toBe('https://www.stuartxchange.org/Sulasi.html');
  });

  it('adds leads for prior method gaps without silently modifying publication clearance', () => {
    const expectedIds = ['Ixora coccinea', 'Mimusops elengi', 'Hibiscus tiliaceus', 'Magnolia champaca']
      .map(scientificName => findRecord(scientificName).candidateId);
    expect(review.previouslyMissingMethodCandidatesWithNewSecondaryLeads.sort()).toEqual(expectedIds.sort());
    for (const candidateId of expectedIds) {
      expect(review.records.find(record => record.candidateId === candidateId)).toMatchObject({
        identityStatus: 'SOURCE_TAXON_LOCATED_PENDING_REVIEW', medicinalInstructionsCleared: false,
        beginnerStepsCleared: false, publicationAllowed: false,
      });
    }
  });

  it('retains primary safety and botanical corrections separately from method leads', () => {
    expect(review.primaryChecks.map(source => source.id)).toEqual(expect.arrayContaining([
      'atis-eye-injury', 'pomegranate-safety', 'bilimbi-kidney-injury', 'starfruit-kidney-warning',
      'pepper-family', 'abutilon-family', 'jujuba-author-distinction',
    ]));
    expect(new Set(review.primaryChecks.map(source => source.id)).size).toBe(review.primaryChecks.length);
    for (const record of review.records) expect(new URL(record.sourceUrl).hostname).toBe('www.stuartxchange.org');
  });

  it('does not misrepresent the public-only observation as an all-state database gate', () => {
    expect(review.publicObservation.publishedRecordsReturned).toBe(38);
    expect(review.publicObservation.blankPreparationMethod).toBe(0);
    expect(review.publicObservation.scope).toContain('not a new private all-state Neon snapshot');
    expect(Object.hasOwn(review, 'herbs')).toBe(false);
  });
});
