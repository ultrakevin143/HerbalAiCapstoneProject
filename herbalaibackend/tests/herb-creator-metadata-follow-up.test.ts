import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

const file = 'HERB_CREATOR_METADATA_FOLLOW_UP_2026-10-07.json';
const readJson = (name: string): unknown => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const correctionSchema = z.object({
  candidateId: z.string(), localName: z.string(), scientificName: z.string(), fieldPlan: z.string(),
  previousCreator: z.literal('no rights reserved'), correctedCreator: z.null(), creatorIndependentlyConfirmed: z.literal(false),
  photoId: z.number().int().positive(), observationId: z.number().int().positive(),
  imageUrl: z.url(), imageSourceUrl: z.url(), imageLicense: z.literal('CC0 1.0'),
  imageLicenseUrl: z.literal('https://creativecommons.org/publicdomain/zero/1.0/'), imageModification: z.string(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/), sourceCheckedAt: z.iso.datetime({ offset: true }),
  freshDeliveryChecked: z.literal(false), botanicalClearance: z.literal(false), publicationAllowed: z.literal(false),
});
const followUp = z.object({
  status: z.literal('CREATOR_METADATA_CORRECTED_RELEASE_HELD'), queueId: z.string(),
  writeAllowed: z.literal(false), stagingAllowed: z.literal(false), publicationAllowed: z.literal(false),
  productionWritesPerformed: z.literal(false),
  historicalReceipts: z.array(z.object({ file: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/) })).length(3),
  counts: z.object({ creatorFieldsCorrected: z.literal(17), selectedCoversUnchanged: z.literal(39),
    namedCreatorsRetainedWithoutFreshReverification: z.literal(20), unknownSelectedCoverCreators: z.literal(19),
    missingSelectedCovers: z.literal(11), publicationCleared: z.literal(0) }),
  corrections: z.array(correctionSchema).length(17),
}).parse(readJson(file));
const planSchema = z.object({
  draftRows: z.array(z.object({
    candidateId: z.string(), creatorMetadataFollowUpFile: z.string().optional(),
    proposedData: z.object({
      localName: z.string(), scientificName: z.string(), imageCreator: z.string().nullable().optional(),
      imageUrl: z.string().optional(), imageSourceUrl: z.string().optional(), imageLicense: z.string().optional(),
      imageLicenseUrl: z.string().optional(), imageModification: z.string().optional(),
      publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
      reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
    }).passthrough(),
  }).passthrough()),
}).passthrough();
const planFiles = ['HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
  ...['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => `HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)];
const plans = planFiles.map(name => ({ file: name, plan: planSchema.parse(readJson(name)) }));
const plan = plans[0]!.plan;
const additionalPlans = plans.slice(1).map(entry => entry.plan);
const historic = z.object({
  records: z.array(z.object({
    candidateId: z.string(), scientificName: z.string(), photoId: z.number(), observationId: z.number(),
    creator: z.literal('no rights reserved'), sourceUrl: z.url(), cloudinaryUrl: z.url(),
    sha256: z.string(), checkedAt: z.string(), licenseCodeObserved: z.literal('cc0'), modification: z.string(),
  })).length(17),
}).parse(readJson('HERB_SEVENTEEN_MEDIA_DELIVERY_2026-10-05.json'));
const input = {
  queue: JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8')) as unknown,
  audit: readJson('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'), plan, additionalPlans,
  leads: readJson('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  mediaFollowUp: { manifest: readJson('HERB_COVER_INTEGRATION_2026-10-07.json'), review: readJson('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
  catalog: { checkedAt: '2026-10-07T01:15:00.000Z', total: 0, herbs: [] },
};

describe('held photo creator metadata correction', () => {
  it.each(followUp.corrections)('corrects only the creator label for $localName', correction => {
    const draft = plans.find(entry => entry.file === correction.fieldPlan)?.plan.draftRows.find(row => row.candidateId === correction.candidateId);
    expect(draft?.creatorMetadataFollowUpFile).toBe(file);
    expect(draft?.proposedData).toMatchObject({
      localName: correction.localName, scientificName: correction.scientificName, imageCreator: null,
      imageUrl: correction.imageUrl, imageSourceUrl: correction.imageSourceUrl, imageLicense: correction.imageLicense,
      imageLicenseUrl: correction.imageLicenseUrl, imageModification: correction.imageModification,
    });
    const original = historic.records.find(row => row.candidateId === correction.candidateId);
    expect(original).toMatchObject({ creator: correction.previousCreator, scientificName: correction.scientificName,
      photoId: correction.photoId, observationId: correction.observationId, cloudinaryUrl: correction.imageUrl,
      sourceUrl: correction.imageSourceUrl, sha256: correction.sourceSha256,
      checkedAt: correction.sourceCheckedAt, modification: correction.imageModification });
  });

  it('covers exactly the historical seventeen without changing the other covers or inventing creators', () => {
    expect(new Set(followUp.corrections.map(row => row.candidateId)).size).toBe(17);
    expect(followUp.corrections.map(row => row.candidateId).sort()).toEqual(historic.records.map(row => row.candidateId).sort());
    const rows = plans.flatMap(entry => entry.plan.draftRows);
    const covers = rows.filter(row => row.proposedData.imageUrl);
    expect(covers).toHaveLength(39);
    expect(covers.filter(row => row.proposedData.imageCreator === null)).toHaveLength(19);
    expect(covers.filter(row => typeof row.proposedData.imageCreator === 'string')).toHaveLength(20);
    expect(rows.filter(row => !row.proposedData.imageUrl)).toHaveLength(11);
    expect(plans.slice(0, 2).every(entry => entry.plan.draftRows.every(row => typeof row.proposedData.imageCreator === 'string'))).toBe(true);
    expect(rows.filter(row => row.creatorMetadataFollowUpFile === file)).toHaveLength(17);
  });

  it.each(followUp.historicalReceipts)('keeps the $file historical receipt byte-equivalent', receipt => {
    const content = readFileSync(new URL(`../../Docs/research/${receipt.file}`, import.meta.url), 'utf8');
    expect(createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex')).toBe(receipt.sha256);
  });

  it('does not treat creator repair as image, human-review or publication clearance', () => {
    const report = reviewExpansionReleasePreflight(input);
    expect(report.counts).toMatchObject({ fullContentDrafts: 49, partialContentDrafts: 1,
      missingSelectedCovers: 11, heldSecondaryIdentities: 2, publicationCleared: 0 });
    expect(report.writeAllowed).toBe(false);
    expect(report.publicationAllowed).toBe(false);
    expect(report.rows.every(row => !row.publicationAllowed && !row.medicinalInstructionsCleared
      && row.blockers.includes('HUMAN_REVIEW_NOT_RECORDED'))).toBe(true);
  });

  it.each(['no rights reserved', 'NO RIGHTS RESERVED', '  No   rights  reserved  ', 'no-rights-reserved',
    'no_rights_reserved', 'no rights reserved.', 'some rights reserved', 'All Rights Reserved',
    'public domain', 'CC0', 'cc0 1.0', 'CC0 1.0 Universal'])('rejects rights/license labels as creator names: %s', creator => {
    const changed = structuredClone(plan);
    changed.draftRows[0]!.proposedData.imageCreator = creator;
    expect(() => reviewExpansionReleasePreflight({ ...input, plan: changed })).toThrow('Image creator must not be a rights or license label');
  });

  it.each([null, undefined, 'photographer_01', 'Photographer Name'])('allows nullable or named metadata without granting clearance: %s', creator => {
    const changed = structuredClone(plan);
    if (creator === undefined) delete changed.draftRows[0]!.proposedData.imageCreator;
    else changed.draftRows[0]!.proposedData.imageCreator = creator;
    expect(reviewExpansionReleasePreflight({ ...input, plan: changed }).publicationAllowed).toBe(false);
  });

  it.each(['', '   '])('rejects empty creator text instead of silently treating it as confirmed: %s', creator => {
    const changed = structuredClone(plan);
    changed.draftRows[0]!.proposedData.imageCreator = creator;
    expect(() => reviewExpansionReleasePreflight({ ...input, plan: changed })).toThrow();
  });

  it('also rejects reintroducing the bad label in an additional batch', () => {
    const changed = structuredClone(additionalPlans);
    const row = changed.flatMap(entry => entry.draftRows).find(draft => draft.creatorMetadataFollowUpFile === file)!;
    row.proposedData.imageCreator = 'no rights reserved';
    expect(() => reviewExpansionReleasePreflight({ ...input, additionalPlans: changed })).toThrow('Image creator must not be a rights or license label');
  });
});
