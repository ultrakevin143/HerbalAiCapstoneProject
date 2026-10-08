import { z } from 'zod';

const requiredText = z.string().trim().min(1).max(8000);
const optionalText = z.string().trim().max(8000).nullable();
export const herbUpdateSchema = z.strictObject({
  localName: requiredText.max(200).optional(),
  scientificName: requiredText.max(300).optional(),
  cebuanoName: optionalText.optional(),
  category: requiredText.max(200).optional(),
  medicinalUses: requiredText.optional(),
  preparationMethod: requiredText.optional(),
  dosage: requiredText.optional(),
  regionFound: optionalText.optional(),
  warnings: optionalText.optional(),
  imageUrl: z.union([z.literal(''), z.url().refine(value => new URL(value).protocol === 'https:', 'Image URLs must use HTTPS.')]).nullable().optional(),
  isDohApproved: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0, 'At least one editable field is required.');
