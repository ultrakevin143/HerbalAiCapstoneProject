import { z } from 'zod';

export const suggestHerbSchema = z.object({
  body: z.object({
    localName: z.string().min(1, 'Local name is required'),
    scientificName: z.string().min(1, 'Scientific name is required'),
    cebuanoName: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    medicinalUses: z.string().min(1, 'Medicinal uses are required'),
    preparationMethod: z.string().min(1, 'Preparation method is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    regionFound: z.string().optional(),
    warnings: z.string().optional(),
    informationSource: z.string().optional(),
  }),
});
