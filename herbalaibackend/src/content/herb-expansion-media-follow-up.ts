import { z } from 'zod';

const text = z.string().trim().min(1);
const identifier = text.regex(/^[a-zA-Z0-9_-]+$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const positiveInteger = z.number().int().positive();
const file = text.regex(/^[A-Z0-9_][A-Z0-9_-]*\.json$/);
const held = { publicationAllowed: z.literal(false), medicinalInstructionsCleared: z.literal(false) };
const manifestSchema = z.object({
  status: z.literal('MEDIA_FOLLOW_UP_NOT_IMPORTABLE'), queueId: text,
  evidenceFile: file, mediaReviewFile: file,
  historicalAuditFile: z.literal('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json'),
  integratedAt: z.iso.datetime(), writeAllowed: z.literal(false), stagingAllowed: z.literal(false),
  publicationAllowed: z.literal(false), productionWritesPerformed: z.literal(false),
  selections: z.array(z.object({
    candidateId: text, photoId: positiveInteger, assetId: identifier, cloudinaryUrl: z.url(), sha256: hash,
  })).min(1).max(50),
});
const reviewSchema = z.object({
  status: z.literal('REPLACEMENT_MEDIA_UPLOADED_NOT_PUBLISHED'), publicationAllowed: z.literal(false), neonWrites: z.literal(0),
  evidenceFile: file.optional(),
  uploads: z.array(z.object({
    candidateId: text, localName: text, scientificName: text, ...held,
    botanicalClearance: z.literal(false), selectedInDraftPlan: z.literal(false),
    imageCreator: z.null(), imageModification: z.literal('None; uploaded unchanged checked source bytes'),
    sourceReview: z.object({
      checkedAt: z.iso.datetime(), httpStatus: z.literal(200), quality: z.literal('research'),
      scientificName: text, rank: z.literal('species'), taxonId: positiveInteger,
      photoId: positiveInteger, observationId: positiveInteger, assetUrl: z.url(), licenseCode: z.literal('cc0'),
      creatorIndependentlyConfirmed: z.literal(false),
    }),
    visualReview: z.object({
      status: z.literal('COVER_QUALITY_PASSED_BOTANICAL_REVIEW_PENDING'),
      imageRetouched: z.literal(false), syntheticImage: z.literal(false), publicationAllowed: z.literal(false),
    }),
    cloudinary: z.object({
      checkedAt: z.iso.datetime(), url: z.url(), publicId: identifier, assetId: identifier,
      cloudName: z.literal('dclqw6at7'), httpStatus: z.literal(200), contentType: z.literal('image/jpeg'),
      bytes: positiveInteger, width: positiveInteger, height: positiveInteger, format: z.literal('jpeg'),
      sha256: hash, sourceSha256: hash, sourceCopyMatches: z.literal(true),
      deliveryBytesMatch: z.literal(true), fullDecodePassed: z.literal(true),
    }),
  })).min(1).max(50),
  decodedOriginals: z.array(z.object({
    candidateId: text, photoId: positiveInteger, observationId: positiveInteger, httpStatus: z.literal(200),
    bytes: positiveInteger, width: positiveInteger, height: positiveInteger, sha256: hash,
    fullDecodePassed: z.literal(true), sizeGatePassed: z.literal(true),
  })).min(1),
  heldOrRejected: z.array(z.object({ photoId: positiveInteger })),
});

type Candidate = { id: string; proposedLocalName: string; scientificName: string };
type AuditRow = { candidateId: string; image: { status: string; cloudinaryUrl?: string | undefined } };

export function reviewExpansionMediaFollowUp(input: {
  manifest: unknown; review: unknown; queueId: string; candidates: Candidate[]; auditRows: AuditRow[];
}) {
  const manifest = manifestSchema.parse(input.manifest);
  const review = reviewSchema.parse(input.review);
  if (manifest.mediaReviewFile !== (review.evidenceFile ?? 'HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json')) {
    throw new Error('Media review file does not match its manifest.');
  }
  if (manifest.queueId !== input.queueId) throw new Error('Media evidence belongs to another queue.');
  for (const values of [manifest.selections.map(row => row.candidateId), review.uploads.map(row => row.candidateId),
    manifest.selections.map(row => row.photoId), review.uploads.map(row => row.sourceReview.photoId),
    review.decodedOriginals.map(row => row.photoId), review.uploads.map(row => row.cloudinary.assetId)]) {
    if (new Set<string | number>(values).size !== values.length) throw new Error('Duplicate media evidence ownership.');
  }
  const covers = manifest.selections.map(selection => {
    const candidate = input.candidates.find(row => row.id === selection.candidateId);
    const earlier = input.auditRows.find(row => row.candidateId === selection.candidateId);
    const upload = review.uploads.find(row => row.candidateId === selection.candidateId);
    if (!candidate || !earlier || !upload || upload.localName !== candidate.proposedLocalName
      || upload.scientificName !== candidate.scientificName || upload.sourceReview.scientificName !== candidate.scientificName) {
      throw new Error('Media evidence identity mismatch.');
    }
    if (earlier.image.cloudinaryUrl || earlier.image.status === 'DELIVERY_BYTES_MATCH') {
      throw new Error('Media follow-up cannot replace an existing selected cover.');
    }
    const source = upload.sourceReview;
    const delivery = upload.cloudinary;
    const original = review.decodedOriginals.find(row => row.photoId === selection.photoId);
    if (source.photoId !== selection.photoId || delivery.assetId !== selection.assetId
      || delivery.url !== selection.cloudinaryUrl || delivery.sha256 !== selection.sha256
      || delivery.sourceSha256 !== selection.sha256 || !original || original.candidateId !== candidate.id
      || original.observationId !== source.observationId || original.sha256 !== selection.sha256
      || original.bytes !== delivery.bytes || original.width !== delivery.width || original.height !== delivery.height
      || Math.min(delivery.width, delivery.height) < 600 || Math.max(delivery.width, delivery.height) < 800
      || review.heldOrRejected.some(row => row.photoId === selection.photoId)) {
      throw new Error('Media evidence byte, quality or ownership mismatch.');
    }
    const expectedSource = `https://inaturalist-open-data.s3.amazonaws.com/photos/${source.photoId}/large.`;
    const expectedDelivery = new RegExp(`^https://res\\.cloudinary\\.com/${delivery.cloudName}/image/upload/(?:v[0-9]+/)?${delivery.publicId}\\.jpg$`);
    if (![`${expectedSource}jpg`, `${expectedSource}jpeg`].includes(source.assetUrl) || !expectedDelivery.test(delivery.url)) {
      throw new Error('Media URL does not belong to the checked source and asset.');
    }
    if (Date.parse(source.checkedAt) > Date.parse(delivery.checkedAt)
      || Date.parse(delivery.checkedAt) > Date.parse(manifest.integratedAt)) {
      throw new Error('Media evidence timestamps are out of order.');
    }
    return {
      candidateId: candidate.id, evidenceFile: manifest.evidenceFile, mediaReviewFile: manifest.mediaReviewFile,
      cloudinaryUrl: delivery.url, checkedAt: delivery.checkedAt,
      imageSourceUrl: `https://www.inaturalist.org/observations/${source.observationId}`,
      imageLicense: 'CC0 1.0', imageLicenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      imageCreator: null, imageModification: upload.imageModification,
    };
  });
  return { evidenceFile: manifest.evidenceFile, mediaReviewFile: manifest.mediaReviewFile, integratedAt: manifest.integratedAt, covers };
}

const heldPlanSchema = z.object({
  status: z.literal('DRAFT_PLAN_NOT_EXECUTABLE'), writeAllowed: z.literal(false), publicationAllowed: z.literal(false),
  draftRows: z.array(z.object({
    candidateId: text, proposedData: z.object({ imageUrl: z.url().optional() }).passthrough(),
  }).passthrough()).min(1).max(50),
}).passthrough();

export function integrateCheckedExpansionMediaPlans(plans: unknown[], media: ReturnType<typeof reviewExpansionMediaFollowUp>) {
  const checkedPlans = plans.map(value => heldPlanSchema.parse(value));
  const candidateIds = checkedPlans.flatMap(plan => plan.draftRows.map(row => row.candidateId));
  if (new Set(candidateIds).size !== candidateIds.length) throw new Error('Duplicate draft media ownership.');
  const coverIds = media.covers.map(cover => cover.candidateId);
  if (new Set(coverIds).size !== coverIds.length || coverIds.some(candidateId => !candidateIds.includes(candidateId))) {
    throw new Error('Media selection must belong to exactly one supplied draft.');
  }
  return checkedPlans.map(plan => ({ ...plan, draftRows: plan.draftRows.map(row => {
    const cover = media.covers.find(value => value.candidateId === row.candidateId);
    if (!cover) return row;
    if (row.proposedData.imageUrl || row.mediaFollowUpEvidenceFile
      || ['imageSourceUrl', 'imageLicense', 'imageLicenseUrl', 'imageCreator', 'imageModification']
        .some(field => row.proposedData[field] !== undefined)) {
      throw new Error('Media integration cannot overwrite existing draft provenance.');
    }
    return { ...row, mediaFollowUpEvidenceFile: cover.evidenceFile, proposedData: {
      ...row.proposedData, imageUrl: cover.cloudinaryUrl, imageSourceUrl: cover.imageSourceUrl,
      imageLicense: cover.imageLicense, imageLicenseUrl: cover.imageLicenseUrl,
      imageCreator: cover.imageCreator, imageModification: cover.imageModification,
    } };
  }) }));
}
