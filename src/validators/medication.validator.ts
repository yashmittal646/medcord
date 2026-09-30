import { z } from 'zod';

const ROUTES = ['ORAL','TOPICAL','INTRAVENOUS','INTRAMUSCULAR','SUBCUTANEOUS','INHALATION','NASAL','OPHTHALMIC','OTIC','RECTAL','SUBLINGUAL','TRANSDERMAL','OTHER'] as const;
const TIMINGS = ['BEFORE_MEAL','WITH_MEAL','AFTER_MEAL','BEDTIME','MORNING','EVENING','AS_NEEDED','ANY_TIME'] as const;
const STATUSES = ['ACTIVE','PAUSED','DISCONTINUED','COMPLETED'] as const;
const DOSE_STATUSES = ['TAKEN','SKIPPED','MISSED','SNOOZED'] as const;

const timePattern = /^\d{2}:\d{2}$/;

export const createMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(150).trim(),
  genericName: z.string().max(150).trim().optional(),
  dosage: z.string().min(1, 'Dosage is required').max(80).trim(),
  unit: z.string().max(30).trim().optional(),
  frequency: z.string().min(1, 'Frequency is required').max(100).trim(),
  timesPerDay: z.number().int().min(1).max(24).optional(),
  scheduleTimes: z.array(z.string().regex(timePattern, 'Time must be HH:MM')).optional(),
  route: z.enum(ROUTES).optional(),
  timing: z.enum(TIMINGS).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  purpose: z.string().max(300).trim().optional(),
  prescribingDoctor: z.string().max(150).trim().optional(),
  instructions: z.string().max(500).trim().optional(),
  status: z.enum(STATUSES).default('ACTIVE'),
  sourceRecordId: z.string().optional(), // MedicalRecord ObjectId string
});

export const updateMedicationSchema = createMedicationSchema.partial();

export const logDoseSchema = z.object({
  status: z.enum(DOSE_STATUSES),
  scheduledDate: z.string(), // ISO date string "YYYY-MM-DD"
  scheduledTime: z.string().regex(timePattern, 'Time must be HH:MM'),
  notes: z.string().max(300).trim().optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type LogDoseInput = z.infer<typeof logDoseSchema>;
