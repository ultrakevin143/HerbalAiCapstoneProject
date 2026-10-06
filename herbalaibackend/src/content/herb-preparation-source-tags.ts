import { z } from 'zod';
import { preparationDigest } from './herb-preparation-update.js';

const text = z.string().trim().min(1);
const storedText = z.string().min(1).refine(value => value.trim().length > 0);
const publicUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
});
const sourceSchema = z.strictObject({
  id: text, url: publicUrl, reviewedTitle: text, scientificName: text,
  fieldPurpose: z.enum(['SAFETY_WITHHOLDING', 'STUDY_FORMULATION_LIMITS']),
  supports: z.tuple([z.literal('preparationMethod')]), reviewLocator: text,
  reviewedMeaning: text, accessNote: text, retrievalUrl: publicUrl, limitations: text,
});
export const preparationSourceTagReviewSchema = z.strictObject({
  schemaVersion: z.literal(1), reviewedAt: z.iso.date(),
  status: z.literal('SOURCE_TAG_REVIEW_NOT_APPLIED'), productionWritesPerformed: z.literal(false),
  scope: text, sources: z.array(sourceSchema).min(1),
  records: z.array(z.strictObject({
    herbId: text, localName: text, scientificName: text, expectedPreparationMethod: storedText,
    sourceIds: z.array(text).min(1),
  })).min(1).max(2),
});
const baselineSchema = z.object({
  checkedAt: z.iso.datetime(), publicUrl, status: z.literal(200), productionWritesPerformed: z.literal(false),
  records: z.array(z.object({
    id: storedText, localName: storedText, scientificName: storedText, publicationStatus: z.literal('PUBLISHED'),
    isVerified: z.literal(true), preparationMethod: storedText,
    sources: z.array(z.object({
      id: z.number().int().positive(), herbId: storedText, title: storedText, publisher: z.string().nullable(),
      url: publicUrl, citation: z.string().nullable(), supports: z.array(storedText), accessedAt: z.iso.datetime(),
    })),
  })).min(1),
});

export const planPreparationSourceTags = (reviewInput: unknown, baselineInput: unknown) => {
  const review = preparationSourceTagReviewSchema.parse(reviewInput);
  const baseline = baselineSchema.parse(baselineInput);
  const sources = new Map(review.sources.map(source => [source.id, source]));
  const records = new Map(baseline.records.map(record => [record.id, record]));
  if (sources.size !== review.sources.length || records.size !== baseline.records.length
    || new Set(review.records.map(record => record.herbId)).size !== review.records.length) {
    throw new Error('Source review or baseline contains duplicate identities.');
  }
  const baselineSourceIds = baseline.records.flatMap(record => record.sources.map(source => source.id));
  if (new Set(baselineSourceIds).size !== baselineSourceIds.length) throw new Error('Baseline source IDs are duplicated.');
  const usedSources = new Set<string>();
  const changes = review.records.flatMap(record => {
    const current = records.get(record.herbId);
    if (!current || current.localName !== record.localName || current.scientificName !== record.scientificName
      || current.preparationMethod !== record.expectedPreparationMethod) {
      throw new Error('Source review does not match the current herb identity and preparation.');
    }
    if (new Set(record.sourceIds).size !== record.sourceIds.length) throw new Error('Duplicate source-review reference.');
    if (current.sources.some(source => source.herbId !== current.id)) throw new Error('Baseline source belongs to another herb.');
    const selectedUrls = new Set<string>();
    return record.sourceIds.flatMap(sourceId => {
      const source = sources.get(sourceId);
      if (!source || source.scientificName !== current.scientificName) throw new Error('Source review is missing or binds another species.');
      if (selectedUrls.has(source.url)) throw new Error('Duplicate reviewed source URL for this herb.');
      selectedUrls.add(source.url);
      usedSources.add(sourceId);
      const matches = current.sources.filter(entry => entry.url === source.url);
      if (matches.length !== 1) throw new Error('Reviewed source URL must resolve to exactly one existing source.');
      const before = matches[0]!;
      if (before.supports.includes('preparationMethod')) return [];
      return [{
        herbId: current.id, localName: current.localName, scientificName: current.scientificName,
        expectedPreparationMethod: current.preparationMethod, sourceId: before.id,
        sourceBefore: before, sourceBeforeSha256: preparationDigest(before),
        proposedSupports: [...before.supports, 'preparationMethod'],
        fieldPurpose: source.fieldPurpose, reviewedMeaning: source.reviewedMeaning,
        reviewLocator: source.reviewLocator, reviewedTitle: source.reviewedTitle, limitations: source.limitations,
      }];
    });
  });
  if (usedSources.size !== sources.size) throw new Error('Source review includes an unbound source.');
  return {
    status: 'SOURCE_TAG_PLAN_NOT_EXECUTABLE', writeAllowed: false, publicationAllowed: false,
    productionWritesPerformed: false, reviewSha256: preparationDigest(review),
    baselineCheckedAt: baseline.checkedAt, changes,
    unchangedFields: ['preparationMethod', 'dosage', 'warnings', 'identity', 'images', 'publicationStatus', 'embedding', 'sourceTitles', 'sourceUrls'],
    releaseGates: ['Fresh independently confirmed database snapshot and current source IDs',
      'Transaction-time baseline comparison, additive-only update and audit record',
      'Isolated PostgreSQL rollback/concurrency tests before live writes',
      'Public catalog and Dr. Ai source-context verification after release'],
  };
};
