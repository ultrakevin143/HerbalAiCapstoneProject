import { z } from 'zod';

export const suggestHerbSchema = z.object({
  body: z.object({
    localName: z.string().trim().min(1, 'Local name is required'),
    scientificName: z.string().trim().min(1, 'Scientific name is required'),
    cebuanoName: z.string().optional(),
    category: z.string().trim().min(1, 'Category is required'),
    medicinalUses: z.string().trim().min(1, 'Medicinal uses are required'),
    preparationMethod: z.string().trim().min(1, 'Preparation method is required'),
    dosage: z.string().trim().min(1, 'Dosage is required'),
    regionFound: z.string().optional(),
    warnings: z.string().optional(),
    informationSource: z.string().trim().min(1, 'Information source is required'),
  }),
});

const publishableEvidenceClass = z.enum([
  'DOH_PITAHC_LISTED',
  'EVIDENCE_SUPPORTED_PHILIPPINE_USE',
  'DOCUMENTED_TRADITIONAL_USE',
]);

export const referenceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  publisher: z.string().trim().max(200).default(''),
  url: z.union([z.literal(''), z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS link')]).default(''),
  citation: z.string().trim().max(2000).default(''),
  publishedAt: z.string().trim().max(50).default(''),
  supports: z.array(z.enum(['identity', 'medicinalUses', 'preparationMethod', 'dosage', 'warnings', 'isDohApproved'])).min(1),
}).refine((source) => Boolean(source.url || source.citation), 'Provide a link or citation');

export const reviewReferencesSchema = z.array(referenceSchema).min(1, 'Add at least one reference').max(20);

export const editSuggestionSchema = z.object({
  body: suggestHerbSchema.shape.body.extend({
    imageUrl: z.union([z.literal(''), z.string().url().refine((value) => /^https?:\/\//i.test(value)), z.string().regex(/^\/images\/herbs\/[a-zA-Z0-9._-]+$/)]),
    references: reviewReferencesSchema,
    revision: z.number().int().nonnegative(),
    reviewNotes: z.string().trim().min(1).max(2000),
  }).strict(),
});

export type SuggestionEdit = z.infer<typeof editSuggestionSchema>['body'];

export const approveSuggestionSchema = z.object({
  body: z.object({
    evidenceClass: publishableEvidenceClass,
    reviewNotes: z.string().trim().max(2000).optional(),
    revision: z.number().int().nonnegative(),
  }),
});

export const requestSuggestionChangesSchema = z.object({
  body: z.object({
    reviewNotes: z.string().trim().min(10, 'Explain the required changes').max(2000),
    revision: z.number().int().nonnegative(),
  }),
});

export const rejectSuggestionSchema = z.object({
  body: z.object({ revision: z.number().int().nonnegative() }),
});
