import { z } from 'zod';

export const healthPathMedicationSchema = z.object({
  medicine: z.string().min(1, 'Medicine name is required').max(150),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)').max(50),
  frequency: z.string().min(1, 'Frequency is required (e.g. Twice daily)').max(100),
  instructions: z.string().max(300).optional(),
  durationDays: z.number().int().positive().optional(),
});

export const createHealthPathSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  condition: z.string().min(2, 'Condition name is required').max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  medications: z.array(healthPathMedicationSchema).default([]),
});

export const updateHealthPathStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']),
});

export const addProgressNoteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty').max(1000),
});

export type CreateHealthPathInput = z.infer<typeof createHealthPathSchema>;
export type UpdateHealthPathStatusInput = z.infer<typeof updateHealthPathStatusSchema>;
export type AddProgressNoteInput = z.infer<typeof addProgressNoteSchema>;
