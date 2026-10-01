import { z } from 'zod';
import { MEDICINE_FORMS } from '../config/medicineForms.js';

export const createMedicineSchema = z.object({
  brandName: z.string().trim().min(2, 'Medicine name is required').max(200),
  strength: z.string().trim().max(80).optional(),
  form: z.enum(MEDICINE_FORMS).default('OTHER'),
  genericName: z.string().trim().max(500).optional(),
  manufacturer: z.string().trim().max(200).optional(),
});

export const favouriteSchema = z.object({ favourite: z.boolean() });
