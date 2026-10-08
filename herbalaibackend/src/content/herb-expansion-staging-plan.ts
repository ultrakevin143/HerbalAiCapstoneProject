import { z } from "zod";
import { expansionQueueSchema, findIdentityConflicts } from "./herb-expansion-review.js";
import { mergeFieldResearchSources, reviewFirstTenFieldResearch } from "./herb-expansion-field-research.js";

const text = z.string().trim().min(1);
const publicUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
});
const sourceSchema = z.object({ id: text, kind: text, title: text, url: publicUrl, limitation: text });
const photoSchema = z.object({
  status: z.literal("VISUALLY_CONSISTENT_NOT_PUBLICATION_CLEARANCE"),
  observationTaxon: text,
  observationQuality: z.literal("research"),
  photoId: z.number().int().positive(),
  observationId: z.number().int().positive(),
  creator: text,
  sourceUrl: publicUrl,
  assetUrl: publicUrl,
  license: z.literal("CC0 1.0"),
  licenseCodeObserved: z.literal("cc0"),
  licenseUrl: z.literal("https://creativecommons.org/publicdomain/zero/1.0/"),
  fullDecodePassed: z.literal(true),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sha256: text.regex(/^[a-f0-9]{64}$/),
  morphologySourceId: text,
  modification: text,
  cloudinaryUrl: publicUrl,
  cloudinaryPublicId: text.regex(/^[a-zA-Z0-9_-]+$/),
  cloudinaryAssetId: text.regex(/^[a-f0-9]{32}$/),
  cloudinaryFolder: z.literal("herbal_ai_herbs"),
  deliveryHttpStatus: z.literal(200),
  deliveryOriginalSha256Matches: z.literal(true),
}).superRefine((photo, context) => {
  if (Math.max(photo.width, photo.height) < 800 || Math.min(photo.width, photo.height) < 600) {
    context.addIssue({ code: "custom", message: "Photo fails the orientation-neutral size gate" });
  }
  const url = new URL(photo.cloudinaryUrl);
  if (url.hostname !== "res.cloudinary.com" || !/^\/dclqw6at7\/image\/upload\/v\d+\//.test(url.pathname) || !url.pathname.endsWith(`/${photo.cloudinaryPublicId}.jpg`) || url.search || url.hash) {
    context.addIssue({ code: "custom", message: "Photo must reference the verified original in the intended Cloudinary cloud" });
  }
  const assetUrl = new URL(photo.assetUrl);
  if (photo.sourceUrl !== `https://www.inaturalist.org/observations/${photo.observationId}` || assetUrl.hostname !== "inaturalist-open-data.s3.amazonaws.com" || !new RegExp(`^/photos/${photo.photoId}/large\\.jpe?g$`).test(assetUrl.pathname) || assetUrl.search || assetUrl.hash) {
    context.addIssue({ code: "custom", message: "Photo source and asset must match the recorded individual observation and photo IDs" });
  }
});
const recordSchema = z.object({
  candidateId: text,
  localName: text,
  scientificName: text,
  bookEntry: z.number().int().positive(),
  printedPage: z.number().int().positive(),
  identity: z.object({
    acceptedNameReviewed: z.literal(true), taxonomyUrl: publicUrl, philippineOccurrence: text, occurrenceSourceUrl: publicUrl.optional(),
    headingReview: z.object({ sourceId: text, heading: text, checkedAt: z.iso.date(), limitation: text }).optional(),
  }),
  traditionalUseDraft: text,
  traditionalSourceIds: z.array(text).min(1),
  modernEvidenceDraft: text,
  modernSourceIds: z.array(text),
  safetyDraft: text,
  safetySourceIds: z.array(text),
  preparationInstructions: z.null(),
  dosage: z.null(),
  withheldHistoricalInstructions: z.array(text).min(1),
  publicationBlockers: z.array(text).min(1),
  photoReview: photoSchema,
});
const reviewSchema = z.object({
  queueId: text,
  status: z.literal("EVIDENCE_REVIEW_NOT_IMPORTABLE"),
  publicationAllowed: z.literal(false),
  stagingAllowed: z.literal(false),
  sources: z.array(sourceSchema).min(1),
  records: z.array(recordSchema).length(10),
});

const identityRowSchema = z.tuple([
  z.enum(["Herb", "SuggestedHerb"]), text, text, text, z.string(), z.string(), text, z.enum(["t", "f", ""]),
]).superRefine((row, context) => {
  const statuses = row[0] === "Herb" ? ["DRAFT", "PUBLISHED", "HOLD", "ARCHIVED"] : ["Pending", "ChangesRequested", "Approved", "Rejected"];
  if (!statuses.includes(row[6])) context.addIssue({ code: "custom", message: "Unknown identity row state" });
});

export const herbIdentitySnapshotSchema = z.object({
  capturedAt: z.iso.datetime(),
  projectId: text,
  branchId: text,
  database: text,
  scope: z.literal("ALL_HERB_AND_SUGGESTION_STATES"),
  railwayConnectionTargetIndependentlyVerified: z.boolean(),
  displayedResultRowCount: z.number().int().nonnegative(),
  counts: z.object({ Herb: z.number().int().nonnegative(), SuggestedHerb: z.number().int().nonnegative(), publicHerbs: z.number().int().nonnegative() }),
  columns: z.tuple([z.literal("recordType"), z.literal("id"), z.literal("localName"), z.literal("scientificName"), z.literal("sourceScientificName"), z.literal("cebuanoName"), z.literal("status"), z.literal("isVerified")]),
  rows: z.array(identityRowSchema),
}).superRefine((snapshot, context) => {
  const herbs = snapshot.rows.filter((row) => row[0] === "Herb");
  if (snapshot.rows.length !== snapshot.displayedResultRowCount || herbs.length !== snapshot.counts.Herb || snapshot.rows.length - herbs.length !== snapshot.counts.SuggestedHerb || herbs.filter((row) => row[6] === "PUBLISHED" && row[7] === "t").length !== snapshot.counts.publicHerbs) {
    context.addIssue({ code: "custom", message: "Snapshot counts do not match the displayed result rows" });
  }
  const keys = snapshot.rows.map((row) => `${row[0]}:${row[1]}`);
  if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: "Duplicate identity result row" });
});

export function planFirstTenDrafts(queueInput: unknown, reviewInput: unknown, snapshotInput: unknown, now = new Date(), fieldResearchInput?: unknown) {
  const queue = expansionQueueSchema.parse(queueInput);
  const review = reviewSchema.parse(reviewInput);
  const snapshot = herbIdentitySnapshotSchema.parse(snapshotInput);
  if (!Number.isFinite(now.getTime())) throw new Error("A valid audit time is required");
  if (review.queueId !== queue.batchId) throw new Error("Review belongs to another research queue");
  const candidates = queue.candidates.filter((candidate) => candidate.batch === 1);
  const sourceMap = new Map(review.sources.map((source) => [source.id, source]));
  if (sourceMap.size !== review.sources.length) throw new Error("Duplicate source definition");
  const recordMap = new Map(review.records.map((record) => [record.candidateId, record]));
  if (recordMap.size !== 10 || candidates.some((candidate) => !recordMap.has(candidate.id))) throw new Error("Review must cover exactly the first ten candidates");
  const fieldResearch = fieldResearchInput === undefined ? undefined : reviewFirstTenFieldResearch(fieldResearchInput, queue.batchId, review.records);
  const catalog = snapshot.rows.map((row) => ({ id: `${row[0]}:${row[1]}`, localName: row[2], scientificName: row[3], sourceScientificName: row[4], localAliases: row[5].split(/\s*[,;/|]\s*/).filter(Boolean) }));
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const conflicts = findIdentityConflicts(queue, catalog).filter((conflict) => candidateIds.has(conflict.candidateId));
  const draftRows = candidates.map((candidate) => {
    const record = recordMap.get(candidate.id)!;
    const fields = fieldResearch?.get(candidate.id);
    if (record.localName !== candidate.proposedLocalName || record.scientificName !== candidate.scientificName || record.bookEntry !== candidate.book.entry || record.printedPage !== candidate.book.printedPage || record.photoReview.observationTaxon !== candidate.scientificName) throw new Error(`Identity mismatch for ${candidate.id}`);
    if (record.identity.philippineOccurrence.includes("PENDING")) throw new Error(`Unresolved Philippine occurrence for ${candidate.id}`);
    const supports = new Map<string, Set<string>>();
    for (const [field, sourceIds] of [["medicinalUses", [...record.traditionalSourceIds, ...(fields ? record.modernSourceIds : [])]], ["evidenceReview", record.modernSourceIds], ["warnings", record.safetySourceIds], ["imageIdentity", [record.photoReview.morphologySourceId]]] as const) {
      for (const sourceId of sourceIds) {
        if (!sourceMap.has(sourceId)) throw new Error(`Missing source ${sourceId}`);
        const fields = supports.get(sourceId) ?? new Set<string>();
        fields.add(field);
        supports.set(sourceId, fields);
      }
    }
    if (sourceMap.get(record.photoReview.morphologySourceId)?.kind !== "BOTANICAL_DESCRIPTION") throw new Error("Photo requires a botanical description source");
    const id = `builtin-expansion-03-pardo-${String(candidate.book.entry).padStart(3, "0")}`;
    if (snapshot.rows.some((row) => row[0] === "Herb" && row[1] === id)) conflicts.push({ candidateId: candidate.id, recordId: `Herb:${id}`, reasons: ["planned record ID"] });
    const proposedSources = mergeFieldResearchSources([...supports].map(([sourceId, fields]) => ({ ...sourceMap.get(sourceId)!, supports: [...fields] })), fields?.proposedSources ?? []);
    const headingReview = record.identity.headingReview;
    if (headingReview) {
      const identitySource = sourceMap.get(headingReview.sourceId);
      if (!identitySource || !["BOTANICAL_DESCRIPTION", "BOTANICAL_IDENTITY"].includes(identitySource.kind)
        || headingReview.heading !== candidate.scientificName) {
        throw new Error(`Invalid botanical heading review for ${candidate.id}`);
      }
      const existingSource = proposedSources.find(source => source.url === identitySource.url);
      if (existingSource) {
        existingSource.supports = [...new Set([...existingSource.supports, "identity"])];
        Object.assign(existingSource, { identityHeadingCheckedAt: headingReview.checkedAt, identityHeading: headingReview.heading, identityReviewLimit: headingReview.limitation });
      } else {
        proposedSources.push({ ...identitySource, supports: ["identity"] });
        Object.assign(proposedSources[proposedSources.length - 1]!, { identityHeadingCheckedAt: headingReview.checkedAt, identityHeading: headingReview.heading, identityReviewLimit: headingReview.limitation });
      }
    }
    const hasWarningSource = proposedSources.some(source => source.supports.includes("warnings"));
    return {
      candidateId: candidate.id,
      identityNotes: { acceptedTaxonKey: candidate.acceptedTaxonKey, scientificSynonyms: candidate.scientificSynonyms, localAliases: candidate.localAliases, taxonomyUrl: record.identity.taxonomyUrl, checklistMatchUrl: candidate.taxonomyUrl, philippineOccurrence: record.identity.philippineOccurrence },
      reviewGaps: [...record.publicationBlockers, ...(fields?.reviewGaps ?? []), ...(hasWarningSource ? [] : ["No plant-part-specific safety source reviewed; warnings are an unresolved review note, not a cited safety finding."])],
      uncitedFields: hasWarningSource ? [] : ["warnings"],
      modernEvidenceNote: fields?.modernEvidenceNote ?? record.modernEvidenceDraft,
      preparationReview: fields ? { plantPart: fields.preparationPart, kind: "FOOD_DESCRIPTION" as const, medicinalInstructionsCleared: false as const } : null,
      occurrenceReview: fields?.geographicScope ? { geographicScope: fields.geographicScope } : null,
      proposedData: {
        id, localName: candidate.proposedLocalName, scientificName: candidate.scientificName, sourceScientificName: candidate.book.heading,
        category: "Uncategorized", medicinalUses: fields ? `${record.traditionalUseDraft}\n\nEvidence limits: ${fields.modernEvidenceNote ?? record.modernEvidenceDraft}` : record.traditionalUseDraft,
        preparationMethod: fields?.preparationMethod ?? "No medicinal preparation instructions cleared in this review.",
        dosage: "No validated medicinal dose established in the reviewed sources.", warnings: fields?.warnings ?? record.safetyDraft,
        ...(fields?.regionFound ? { regionFound: fields.regionFound } : {}),
        imageUrl: record.photoReview.cloudinaryUrl, imageCreator: record.photoReview.creator, imageSourceUrl: record.photoReview.sourceUrl, imageLicense: record.photoReview.license, imageLicenseUrl: record.photoReview.licenseUrl, imageModification: record.photoReview.modification,
        publicationStatus: "DRAFT" as const, evidenceClass: "UNASSESSED" as const, provenance: "BUILT_IN" as const,
        isVerified: false, isDohApproved: false, reviewedAt: null, reviewedById: null, embedding: null,
      },
      proposedSources,
    };
  });
  const blockers = ["Isolated database staging, rollback and concurrent-write tests have not been run; this planner cannot write to a database.", "A future writer must re-read all identities inside its transaction and prevent competing Herb/SuggestedHerb writes. A saved snapshot is not a concurrency guarantee."];
  const age = now.getTime() - new Date(snapshot.capturedAt).getTime();
  if (age < 0 || age > 60 * 60 * 1000) blockers.push("Snapshot is future-dated or older than one hour; capture a fresh unfiltered result.");
  if (!snapshot.railwayConnectionTargetIndependentlyVerified) blockers.push("The selected Neon branch has not been independently matched to Railway's configured database target.");
  if (conflicts.length) blockers.push("Existing record identities conflict with the proposed drafts; do not overwrite or insert these candidates.");
  return {
    status: "DRAFT_PLAN_NOT_EXECUTABLE" as const,
    queueId: queue.batchId,
    auditedAt: now.toISOString(),
    snapshotCapturedAt: snapshot.capturedAt,
    comparisonScope: snapshot.scope,
    target: { projectId: snapshot.projectId, branchId: snapshot.branchId, database: snapshot.database },
    writeAllowed: false as const,
    publicationAllowed: false as const,
    comparedHerbs: snapshot.counts.Herb,
    comparedSuggestions: snapshot.counts.SuggestedHerb,
    conflicts,
    blockers,
    draftRows,
  };
}
