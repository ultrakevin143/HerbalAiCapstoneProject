import { z } from 'zod';
import { expansionQueueSchema, findIdentityConflicts } from './herb-expansion-review.js';
import { reviewExpansionMediaFollowUp } from './herb-expansion-media-follow-up.js';

const text = z.string().trim().min(1);
const rightsLabels = new Set(['no rights reserved', 'some rights reserved', 'all rights reserved',
  'public domain', 'cc0', 'cc0 1.0', 'cc0 1.0 universal']);
const photoCreator = text.refine(value => !rightsLabels.has(
  value.toLowerCase().replace(/[\s_-]+/g, ' ').replace(/[.!]+$/g, ''),
), { message: 'Image creator must not be a rights or license label; use null for an unconfirmed creator.' });
const publicUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
});
const heldFlags = { publicationAllowed: z.literal(false), stagingAllowed: z.literal(false) };
const auditSchema = z.object({
  queueId: text, auditedAt: z.iso.datetime(), ...heldFlags,
  candidates: z.array(z.object({
    candidateId: text, localName: text, scientificName: text, batch: z.number().int(),
    missingManifestFields: z.array(text), ...heldFlags,
    preparation: z.object({ description: text, sourceFile: text, sourceIds: z.array(text) }),
    image: z.object({ status: text, cloudinaryUrl: publicUrl.optional(), checkedAt: z.iso.datetime().optional() }),
  })).length(50),
});
const planSchema = z.object({
  queueId: text, auditedAt: z.iso.datetime(), snapshotCapturedAt: z.iso.datetime().nullable(),
  evidenceFile: text.regex(/^[A-Z0-9_][A-Z0-9_-]*\.json$/).optional(),
  status: z.literal('DRAFT_PLAN_NOT_EXECUTABLE'), writeAllowed: z.literal(false), publicationAllowed: z.literal(false),
  draftRows: z.array(z.object({
    candidateId: text, reviewGaps: z.array(text), uncitedFields: z.array(text),
    mediaFollowUpEvidenceFile: text.optional(),
    preparationReview: z.object({
      kind: text, methodEstablishedInReview: z.boolean().optional(),
      medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false).optional(),
    }).optional(),
    proposedData: z.object({
      id: text, localName: text, scientificName: text, category: text,
      medicinalUses: text, preparationMethod: text, dosage: text, warnings: text, regionFound: text.optional(),
      imageUrl: publicUrl.optional(), publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
      imageSourceUrl: publicUrl.optional(), imageLicense: text.optional(), imageLicenseUrl: publicUrl.optional(),
      imageCreator: photoCreator.nullable().optional(), imageModification: text.optional(),
      isVerified: z.literal(false), isDohApproved: z.literal(false), reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
    }),
    proposedSources: z.array(z.object({
      id: text, url: publicUrl, supports: z.array(text),
      scientificName: text.nullable().optional(), taxonScope: z.enum(['EXACT_SPECIES', 'GENUS_ONLY']).optional(),
      sourceStatus: text.optional(),
    })).min(1),
  })).min(1).max(50),
});
const leadSchema = z.object({
  queueId: text, publicationAllowed: z.literal(false),
  records: z.array(z.object({
    candidateId: text, localName: text, scientificName: text, identityStatus: text,
    sourceUrl: publicUrl.nullable(), publicationAllowed: z.literal(false),
    medicinalInstructionsCleared: z.literal(false), beginnerStepsCleared: z.literal(false),
  })).length(50),
});
const catalogSchema = z.object({
  checkedAt: z.iso.datetime(), total: z.number().int().nonnegative(),
  herbs: z.array(z.object({
    id: text, localName: text, scientificName: text,
    sourceScientificName: z.string().nullable().optional(), cebuanoName: z.string().nullable().optional(),
  })),
}).superRefine((catalog, context) => {
  if (catalog.total !== catalog.herbs.length || new Set(catalog.herbs.map(herb => herb.id)).size !== catalog.total) {
    context.addIssue({ code: 'custom', message: 'Public catalog must contain all distinct returned rows.' });
  }
});

export function reviewExpansionReleasePreflight(input: {
  queue: unknown; audit: unknown; plan: unknown; leads: unknown; catalog: unknown; additionalPlans?: unknown[];
  mediaFollowUp?: { manifest: unknown; review: unknown };
  additionalMediaFollowUps?: { manifest: unknown; review: unknown }[];
}) {
  const queue = expansionQueueSchema.parse(input.queue);
  const audit = auditSchema.parse(input.audit);
  const plan = planSchema.parse(input.plan);
  const plans = [plan, ...(input.additionalPlans ?? []).map(value => planSchema.parse(value))];
  if (plans.slice(1).some(ledger => !ledger.evidenceFile)) {
    throw new Error('Additional draft plans must identify their evidence file.');
  }
  const leads = leadSchema.parse(input.leads);
  const catalog = catalogSchema.parse(input.catalog);
  for (const ledger of [audit, ...plans, leads]) {
    if (ledger.queueId !== queue.batchId) throw new Error('Release evidence belongs to another queue.');
  }
  const candidates = new Map(queue.candidates.map(candidate => [candidate.id, candidate]));
  const assertRows = (rows: { candidateId: string; localName: string; scientificName: string }[], complete: boolean) => {
    if (new Set(rows.map(row => row.candidateId)).size !== rows.length || (complete && rows.length !== candidates.size)) {
      throw new Error('Release evidence has missing or duplicate candidates.');
    }
    for (const row of rows) {
      const candidate = candidates.get(row.candidateId);
      if (!candidate || row.localName !== candidate.proposedLocalName || row.scientificName !== candidate.scientificName) {
        throw new Error(`Release evidence identity mismatch: ${row.candidateId}`);
      }
    }
  };
  assertRows(audit.candidates, true);
  assertRows(leads.records, true);
  const media = input.mediaFollowUp ? reviewExpansionMediaFollowUp({
    ...input.mediaFollowUp, queueId: queue.batchId, candidates: queue.candidates, auditRows: audit.candidates,
  }) : undefined;
  const additionalMedia = (input.additionalMediaFollowUps ?? []).map(value => reviewExpansionMediaFollowUp({
    ...value, queueId: queue.batchId, candidates: queue.candidates, auditRows: audit.candidates,
  }));
  const mediaCovers = [...(media?.covers ?? []), ...additionalMedia.flatMap(value => value.covers)];
  for (const identifiers of [mediaCovers.map(cover => cover.candidateId), mediaCovers.map(cover => cover.cloudinaryUrl)]) {
    if (new Set(identifiers).size !== identifiers.length) throw new Error('Duplicate media ownership across follow-ups.');
  }
  const drafts = plans.flatMap(ledger => ledger.draftRows.map(row => ({
    ...row, evidenceFile: ledger.evidenceFile ?? 'HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
  })));
  assertRows(drafts.map(row => ({ candidateId: row.candidateId, ...row.proposedData })), false);
  if (new Set(drafts.map(row => row.proposedData.id)).size !== drafts.length) {
    throw new Error('Release evidence has duplicate proposed record IDs.');
  }
  const conflicts = findIdentityConflicts(queue, catalog.herbs.map(herb => ({
    id: herb.id, localName: herb.localName, scientificName: herb.scientificName,
    sourceScientificName: herb.sourceScientificName ?? null,
    localAliases: (herb.cebuanoName ?? '').split(/\s*[,;/|]\s*/).filter(Boolean),
  })));
  const rows = queue.candidates.map(candidate => {
    const earlier = audit.candidates.find(row => row.candidateId === candidate.id)!;
    const draft = drafts.find(row => row.candidateId === candidate.id);
    const lead = leads.records.find(row => row.candidateId === candidate.id)!;
    const cover = mediaCovers.find(row => row.candidateId === candidate.id);
    const selectedCoverUrl = cover?.cloudinaryUrl ?? earlier.image.cloudinaryUrl;
    if (earlier.batch !== candidate.batch) throw new Error('Release evidence batch mismatch.');
    if (draft && draft.proposedData.imageUrl !== selectedCoverUrl) {
      throw new Error(`Draft cover does not match selected audit evidence: ${candidate.id}`);
    }
    if (draft?.mediaFollowUpEvidenceFile && (!cover || draft.mediaFollowUpEvidenceFile !== cover.evidenceFile)) {
      throw new Error(`Draft media follow-up evidence mismatch: ${candidate.id}`);
    }
    if (draft && cover && (draft.mediaFollowUpEvidenceFile !== cover.evidenceFile
      || draft.proposedData.imageSourceUrl !== cover.imageSourceUrl || draft.proposedData.imageLicense !== cover.imageLicense
      || draft.proposedData.imageLicenseUrl !== cover.imageLicenseUrl || draft.proposedData.imageCreator !== cover.imageCreator
      || draft.proposedData.imageModification !== cover.imageModification)) {
      throw new Error(`Draft media provenance mismatch: ${candidate.id}`);
    }
    if (draft && new Set(draft.proposedSources.map(source => source.id)).size !== draft.proposedSources.length) {
      throw new Error(`Draft has duplicate source IDs: ${candidate.id}`);
    }
    if (draft?.proposedSources.some(source => source.taxonScope === 'GENUS_ONLY' && source.supports.includes('preparationMethod'))) {
      throw new Error(`Genus-only evidence cannot support exact-species preparation: ${candidate.id}`);
    }
    if (draft?.proposedSources.some(source => source.scientificName && source.scientificName !== candidate.scientificName)) {
      throw new Error(`Draft source species mismatch: ${candidate.id}`);
    }
    if (draft?.proposedSources.some(source => source.sourceStatus?.startsWith('QUARANTINED')
      && source.supports.some(field => field !== 'researchGap'))) {
      throw new Error(`Quarantined evidence may support research gaps only: ${candidate.id}`);
    }
    const gaps = new Set<string>(['IDENTITY_REVIEW_PENDING', 'CONTENT_SAFETY_REVIEW_PENDING', 'HUMAN_REVIEW_NOT_RECORDED']);
    const missingDraftFields = draft ? [
      ...(!draft.proposedData.regionFound ? ['regionFound'] : []),
      ...(draft.preparationReview?.kind === 'METHOD_NOT_ESTABLISHED'
        || draft.preparationReview?.methodEstablishedInReview === false
        || draft.uncitedFields.includes('preparationMethod')
        || !draft.proposedSources.some(source => source.supports.includes('preparationMethod')) ? ['preparationMethod'] : []),
    ] : [];
    const fullContentDraftPresent = Boolean(draft && !missingDraftFields.length);
    if (!fullContentDraftPresent) gaps.add('FULL_CONTENT_DRAFT_MISSING');
    if (!cover && (earlier.image.status !== 'DELIVERY_BYTES_MATCH' || !earlier.image.cloudinaryUrl)) gaps.add('SELECTED_COVER_MISSING');
    if (lead.identityStatus !== 'SOURCE_TAXON_LOCATED_PENDING_REVIEW') gaps.add('SECONDARY_SOURCE_IDENTITY_HELD');
    if (draft) {
      if (draft.proposedData.category === 'Uncategorized') gaps.add('CATEGORY_UNRESOLVED');
      if (!draft.proposedData.regionFound) gaps.add('REGION_UNRESOLVED');
      if (missingDraftFields.includes('preparationMethod')) gaps.add('PREPARATION_METHOD_UNRESOLVED');
      for (const field of ['identity', 'medicinalUses', 'preparationMethod', 'warnings', 'regionFound']) {
        if (!draft.proposedSources.some(source => source.supports.includes(field))) gaps.add(`SOURCE_TAG_REVIEW:${field}`);
      }
      for (const field of draft.uncitedFields) gaps.add(`UNCITED_FIELD:${field}`);
      if (draft.reviewGaps.length) gaps.add('DRAFT_REVIEW_GAPS_OPEN');
    }
    const matchingPublic = conflicts.filter(conflict => conflict.candidateId === candidate.id);
    if (matchingPublic.length) gaps.add('PUBLIC_IDENTITY_CONFLICT');
    return {
      candidateId: candidate.id, localName: candidate.proposedLocalName, scientificName: candidate.scientificName,
      batch: candidate.batch, draftPlanPresent: Boolean(draft), fullContentDraftPresent, blockers: [...gaps],
      draftReviewNotes: draft?.reviewGaps ?? [],
      earlierMissingFields: draft ? missingDraftFields : earlier.missingManifestFields,
      selectedCoverUrl: selectedCoverUrl ?? null, imageCheckAt: cover?.checkedAt ?? earlier.image.checkedAt ?? null,
      imageEvidenceFile: cover?.evidenceFile ?? 'HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json',
      preparationDescription: draft?.proposedData.preparationMethod ?? earlier.preparation.description,
      preparationEvidenceFile: draft?.evidenceFile ?? earlier.preparation.sourceFile,
      preparationSourceIds: draft
        ? draft.proposedSources.filter(source => source.supports.includes('preparationMethod')).map(source => source.id)
        : earlier.preparation.sourceIds,
      medicinalInstructionsCleared: false as const,
      descriptivePreparationLeadOnly: !draft, sourceIdentityStatus: lead.identityStatus,
      matchedPublicRecords: matchingPublic, publicationAllowed: false as const,
    };
  });
  return {
    status: 'HELD_EXPANSION_RELEASE_PREFLIGHT' as const, queueId: queue.batchId,
    checkedAt: catalog.checkedAt, publicationAllowed: false as const, writeAllowed: false as const,
    publicCatalogOnly: true as const,
    historicalAuditAt: audit.auditedAt, draftPlanAt: plan.auditedAt, privateSnapshotAt: plan.snapshotCapturedAt,
    mediaFollowUpEvidence: media ? { evidenceFile: media.evidenceFile, mediaReviewFile: media.mediaReviewFile,
      integratedAt: media.integratedAt, selectedCovers: media.covers.length } : null,
    additionalMediaFollowUpEvidence: additionalMedia.map(value => ({ evidenceFile: value.evidenceFile,
      mediaReviewFile: value.mediaReviewFile, integratedAt: value.integratedAt, selectedCovers: value.covers.length })),
    draftEvidence: plans.map(ledger => ({
      evidenceFile: ledger.evidenceFile ?? 'HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
      auditedAt: ledger.auditedAt, privateSnapshotAt: ledger.snapshotCapturedAt,
    })),
    globalBlockers: [
      'Fresh, independently targeted all-state private-database comparison is still required before any write.',
      'A backed-up import with isolated rollback and concurrent-duplicate tests is not present.',
      'Historical image checks do not establish fresh delivery, licensing or taxon clearance.',
      'Secondary preparation leads do not clear beginner instructions or medicinal dosage.',
      'This report is read-only; no publish, database or embedding operation exists.',
    ],
    counts: {
      candidates: rows.length, livePublicHerbs: catalog.total,
      draftPlansPresent: rows.filter(row => row.draftPlanPresent).length,
      partialContentDrafts: rows.filter(row => row.draftPlanPresent && !row.fullContentDraftPresent).length,
      fullContentDrafts: rows.filter(row => row.fullContentDraftPresent).length,
      missingFullContentDrafts: rows.filter(row => !row.fullContentDraftPresent).length,
      missingSelectedCovers: rows.filter(row => row.blockers.includes('SELECTED_COVER_MISSING')).length,
      heldSecondaryIdentities: rows.filter(row => row.blockers.includes('SECONDARY_SOURCE_IDENTITY_HELD')).length,
      publicIdentityConflicts: conflicts.length, publicationCleared: 0,
    },
    rows,
  };
}
