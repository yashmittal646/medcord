import { z } from 'zod';

export const updateBasicProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1, 'Contact name is required'),
      relationship: z.string().min(1, 'Relationship is required'),
      phone: z.string().min(1, 'Contact phone is required'),
    })
    .optional(),
});

export const allergySchema = z.object({
  substance: z.string().min(1, 'Allergy substance/medicine is required').max(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']).default('MODERATE'),
  notes: z.string().max(500).optional(),
});

export const chronicConditionSchema = z.object({
  condition: z.string().min(1, 'Condition name is required').max(150),
  status: z.enum(['ACTIVE', 'MANAGED', 'RESOLVED']).default('ACTIVE'),
  notes: z.string().max(500).optional(),
  diagnosedDate: z.string().optional(),
});

export const medicationSchema = z.object({
  medicine: z.string().min(1, 'Medicine name is required').max(150),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg, 1 tablet)').max(50),
  frequency: z.string().min(1, 'Frequency is required (e.g. Once daily after dinner)').max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).default('ACTIVE'),
});

export type UpdateBasicProfileInput = z.infer<typeof updateBasicProfileSchema>;
export type AllergyInput = z.infer<typeof allergySchema>;
export type ChronicConditionInput = z.infer<typeof chronicConditionSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
