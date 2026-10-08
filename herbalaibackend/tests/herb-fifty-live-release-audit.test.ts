import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { expansionQueueSchema } from '../src/content/herb-expansion-review.js';
import { buildPreparationPlan } from '../src/content/herb-preparation-update.js';

const readResearch = (name: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const queue = expansionQueueSchema.parse(JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')));
const audit = z.object({
  status: z.literal('FIFTY_CANDIDATES_NOT_RELEASE_READY'), queueId: z.string(), auditedAt: z.iso.datetime(),
  productionWritesPerformed: z.literal(false), uploadsPerformed: z.literal(false), gitCommitPerformed: z.literal(false),
  gitPushPerformed: z.literal(false), publicationAllowed: z.literal(false), stagingAllowed: z.literal(false),
  counts: z.record(z.string(), z.number()),
  live: z.object({ capturedAt: z.iso.datetime(), transactionReadOnly: z.literal('on'),
    counts: z.object({ Herb: z.number(), SuggestedHerb: z.number(), public: z.number() }),
    blankFields: z.record(z.string(), z.array(z.object({ id: z.string(), localName: z.string() }))),
    fieldMismatches: z.array(z.unknown()), genericPreparationCount: z.number(),
    missing768DimensionalEmbeddings: z.array(z.object({ id: z.string(), localName: z.string(), dimensions: z.null() })),
  }),
  newSourceLead: z.object({ candidateId: z.string(), retrievalStatus: z.literal(200), adoptedIntoCoverage: z.literal(false), scope: z.string() }),
  candidates: z.array(z.object({
    candidateId: z.string(), batch: z.number(), localName: z.string(), scientificName: z.string(),
    bookEntry: z.number(), printedPage: z.number(), identityReview: z.literal('PENDING'), medicalReview: z.literal('PENDING'),
    matchedLiveRecords: z.array(z.unknown()), fullContentDraftPresent: z.boolean(), missingManifestFields: z.array(z.string()),
    preparation: z.object({ sourceFile: z.string(), kind: z.string(), coverageClass: z.string(), part: z.string(),
      description: z.string().min(40), sourceIds: z.array(z.string()), householdRecipeEstablished: z.literal(false), medicinalInstructionsCleared: z.literal(false) }),
    image: z.object({ status: z.enum(['DELIVERY_BYTES_MATCH', 'NO_SELECTED_UPLOADED_COVER']),
      cloudinaryUrl: z.url().optional(), ledger: z.string().optional(), sourceSha256Matches: z.literal(true).optional(),
      licenseCodeObserved: z.literal('cc0').optional() }),
    publicationAllowed: z.literal(false), stagingAllowed: z.literal(false),
  })).length(50),
}).parse(readResearch('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'));

describe('saved fifty-herb live audit evidence consistency', () => {
  it('accounts for every queued identity and historical pointer exactly once', () => {
    expect(audit.queueId).toBe(queue.batchId);
    expect(new Set(audit.candidates.map(candidate => candidate.candidateId)).size).toBe(50);
    expect(audit.candidates.map(candidate => candidate.candidateId).sort()).toEqual(queue.candidates.map(candidate => candidate.id).sort());
    for (const candidate of queue.candidates) expect(audit.candidates.find(row => row.candidateId === candidate.id)).toMatchObject({
      batch: candidate.batch, localName: candidate.proposedLocalName, scientificName: candidate.scientificName,
      bookEntry: candidate.book.entry, printedPage: candidate.book.printedPage,
    });
  });

  it('derives all completion counts from held evidence rather than the requested batch size', () => {
    const selectedImages = audit.candidates.filter(candidate => candidate.image.status === 'DELIVERY_BYTES_MATCH').length;
    const drafts = audit.candidates.filter(candidate => candidate.fullContentDraftPresent).length;
    expect(audit.counts).toEqual({
      candidates: audit.candidates.length, liveIdentityConflicts: audit.candidates.flatMap(candidate => candidate.matchedLiveRecords).length,
      fullContentDrafts: drafts, withoutFullContentDrafts: audit.candidates.length - drafts,
      boundedFoodDescriptions: audit.candidates.filter(candidate => candidate.preparation.coverageClass === 'BOUNDED_FOOD_DESCRIPTION').length,
      otherHeldDescriptions: audit.candidates.filter(candidate => candidate.preparation.coverageClass.startsWith('HELD_')).length,
      methodsNotEstablished: audit.candidates.filter(candidate => candidate.preparation.kind === 'METHOD_NOT_ESTABLISHED').length,
      selectedCloudinaryCovers: selectedImages, freshDeliveryHashesMatched: selectedImages,
      missingSelectedUploadedCovers: audit.candidates.length - selectedImages, completeImportManifests: 0, publicationCleared: 0,
    });
    expect(drafts).toBe(10);
    expect(selectedImages).toBe(37);
    expect(audit.counts.methodsNotEstablished).toBe(4);
  });

  it('retains each exact preparation description and source ownership, including the Talisay overlay', () => {
    const ledgerSchema = z.object({ sources: z.array(z.object({ id: z.string() })),
      proposal: z.object({ candidateId: z.string(), proposedPreparationMethod: z.string(), preparationSourceIds: z.array(z.string()) }).optional(),
      records: z.array(z.object({ candidateId: z.string(), preparationDescription: z.string(), preparationSourceIds: z.array(z.string()) })).optional(),
    });
    for (const candidate of audit.candidates) {
      const ledger = ledgerSchema.parse(readResearch(candidate.preparation.sourceFile));
      const original = ledger.proposal ?? ledger.records?.find(record => record.candidateId === candidate.candidateId);
      if (!original) throw new Error(`Missing audited preparation: ${candidate.candidateId}`);
      expect(candidate.preparation.description).toBe('proposedPreparationMethod' in original ? original.proposedPreparationMethod : original.preparationDescription);
      expect(candidate.preparation.sourceIds).toEqual(original.preparationSourceIds);
      for (const sourceId of candidate.preparation.sourceIds) expect(ledger.sources.some(source => source.id === sourceId)).toBe(true);
    }
  });

  it('does not promote the separate animal-study lead or quarantined metadata into a home recipe', () => {
    expect(audit.newSourceLead.candidateId).toBe('research-pardo-003');
    expect(audit.newSourceLead.scope).toMatch(/animal.*not a validated human recipe/);
    const magnolia = audit.candidates.find(candidate => candidate.candidateId === audit.newSourceLead.candidateId);
    expect(magnolia?.preparation.kind).toBe('METHOD_NOT_ESTABLISHED');
    expect(magnolia?.preparation.sourceIds).toEqual([]);
    expect(magnolia?.preparation.sourceFile).toBe('HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json');
  });

  it('ties every uploaded-cover result to the selected recorded Cloudinary asset', () => {
    const photoSchema = z.object({ candidateId: z.string(), cloudinaryUrl: z.string().nullable().optional() });
    const mediaSchema = z.object({ photos: z.array(photoSchema).optional(), records: z.array(photoSchema).optional() });
    for (const candidate of audit.candidates) {
      if (candidate.image.status !== 'DELIVERY_BYTES_MATCH') {
        expect(candidate.image.cloudinaryUrl).toBeUndefined();
        continue;
      }
      const ledger = mediaSchema.parse(readResearch(candidate.image.ledger!));
      expect([...(ledger.photos ?? []), ...(ledger.records ?? [])].some(photo => photo.candidateId === candidate.candidateId && photo.cloudinaryUrl === candidate.image.cloudinaryUrl)).toBe(true);
      const url = new URL(candidate.image.cloudinaryUrl!);
      expect(url.hostname).toBe('res.cloudinary.com');
      expect(url.pathname).toMatch(/^\/dclqw6at7\/image\/upload\//);
      expect(candidate.image.sourceSha256Matches).toBe(true);
      expect(candidate.image.licenseCodeObserved).toBe('cc0');
    }
  });

  it('leaves the missing manifest fields and unreviewed medical identities explicit', () => {
    for (const candidate of audit.candidates) {
      expect(candidate.missingManifestFields).toEqual(expect.arrayContaining(['category', 'regionFound', 'explicitReviewedDosageLimitation']));
      if (!candidate.fullContentDraftPresent) expect(candidate.missingManifestFields).toEqual(expect.arrayContaining(['traditionalUseDraft', 'modernEvidenceDraft', 'completeIdentityAndSafetyDraft']));
    }
  });

  it('records time-bound live structural findings without relabeling them fifty published herbs', () => {
    expect(audit.live.counts).toEqual({ Herb: 38, SuggestedHerb: 17, public: 38 });
    expect(audit.live.blankFields.preparationMethod).toEqual([]);
    expect(audit.live.genericPreparationCount).toBe(0);
    expect(audit.live.fieldMismatches).toEqual([]);
    expect(audit.live.blankFields.imageUrl.map(record => record.localName)).toEqual(['Kalingag']);
    expect(audit.live.missing768DimensionalEmbeddings.map(record => record.localName).sort()).toEqual(['Gumamela', 'Indian Heliotrope', 'Tanglad']);
    expect(new Date(audit.auditedAt).getTime()).toBeGreaterThanOrEqual(new Date(audit.live.capturedAt).getTime());
  });

  it('cannot be passed to the existing twenty-record preparation updater as an import batch', () => {
    expect(() => buildPreparationPlan(audit, [], { host: 'localhost', database: 'herbalai_test' })).toThrow();
  });
});
