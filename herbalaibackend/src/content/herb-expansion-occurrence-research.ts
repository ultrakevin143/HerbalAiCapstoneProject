import { z } from 'zod';
import type { FieldResearchSource } from './herb-expansion-field-research.js';

const text = z.string().trim().min(1);
const geographicScope = z.enum(['COUNTRY_ONLY', 'SPECIFIC_LOCALITY', 'STUDY_AREA']);
const identitySchema = z.object({
  candidateId: text, localName: text, scientificName: text,
  bookEntry: z.number().int().positive(), printedPage: z.number().int().positive(),
});
const sourceSchema = z.object({
  id: text, kind: z.enum(['BOTANICAL_OCCURRENCE', 'PHILIPPINE_ETHNOBOTANY']), title: text,
  url: z.url().refine(value => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }),
  limitation: text, supports: z.tuple([z.literal('regionFound')]),
  reviewedAt: z.iso.date(), reviewLocator: text, accessNote: text,
  claims: z.array(z.object({ scientificName: text, geographicScope, regionFound: text })).min(1),
});
export const occurrenceResearchSchema = z.object({
  schemaVersion: z.literal(1), queueId: text, reviewedAt: z.iso.date(),
  status: z.literal('OCCURRENCE_REVIEW_NOT_IMPORTABLE'),
  publicationAllowed: z.literal(false), stagingAllowed: z.literal(false), productionWritesPerformed: z.literal(false),
  scope: text, sources: z.array(sourceSchema).min(1),
  records: z.array(identitySchema.extend({
    proposedRegionFound: text, geographicScope, occurrenceSourceIds: z.array(text).min(1),
    publicationAllowed: z.literal(false),
  })).length(10),
});

export function reviewFirstTenOccurrenceResearch(input: unknown, queueId: string, identities: z.infer<typeof identitySchema>[]) {
  const ledger = occurrenceResearchSchema.parse(input);
  if (ledger.queueId !== queueId) throw new Error('Occurrence research belongs to another research queue');
  const expected = new Map(identities.map(record => [record.candidateId, record]));
  const records = new Map(ledger.records.map(record => [record.candidateId, record]));
  if (expected.size !== 10 || records.size !== 10 || [...records.keys()].some(candidateId => !expected.has(candidateId))) {
    throw new Error('Occurrence research must cover exactly the first ten candidates');
  }
  const sources = new Map(ledger.sources.map(source => [source.id, source]));
  if (sources.size !== ledger.sources.length) throw new Error('Duplicate occurrence source definition');
  const scientificNames = new Set(identities.map(record => record.scientificName));
  for (const source of sources.values()) {
    if (new Set(source.claims.map(claim => claim.scientificName)).size !== source.claims.length
      || source.claims.some(claim => !scientificNames.has(claim.scientificName))) {
      throw new Error('Occurrence source claims must identify distinct reviewed species');
    }
  }
  const result = new Map<string, {
    regionFound: string; geographicScope: z.infer<typeof geographicScope>; proposedSources: FieldResearchSource[];
  }>();
  for (const record of records.values()) {
    const identity = expected.get(record.candidateId)!;
    if (record.localName !== identity.localName || record.scientificName !== identity.scientificName
      || record.bookEntry !== identity.bookEntry || record.printedPage !== identity.printedPage) {
      throw new Error(`Occurrence research identity mismatch for ${record.candidateId}`);
    }
    if (new Set(record.occurrenceSourceIds).size !== record.occurrenceSourceIds.length) {
      throw new Error('Duplicate occurrence source reference');
    }
    const proposedSources = record.occurrenceSourceIds.map(sourceId => {
      const source = sources.get(sourceId);
      const claim = source?.claims.find(claim => claim.scientificName === record.scientificName);
      if (!source || !claim || claim.regionFound !== record.proposedRegionFound || claim.geographicScope !== record.geographicScope) {
        throw new Error(`Occurrence source does not support the exact species, region and scope for ${record.candidateId}`);
      }
      return {
        id: source.id, kind: source.kind, title: source.title, url: source.url,
        limitation: source.limitation, supports: ['regionFound'],
      };
    });
    result.set(record.candidateId, { regionFound: record.proposedRegionFound, geographicScope: record.geographicScope, proposedSources });
  }
  return result;
}

