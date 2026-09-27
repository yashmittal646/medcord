import { z } from 'zod';

export const createMedicalRecordSchema = z.object({
  recordType: z.enum(['PRESCRIPTION', 'LAB_REPORT', 'CONSULTATION', 'CHECKUP', 'OTHER']),
  title: z.string().min(2, 'Record title must be at least 2 characters').max(200),
  recordDate: z.string().optional(),
  doctorName: z.string().max(100).optional(),
  facilityName: z.string().max(150).optional(),
  description: z.string().max(1000).optional(),
  diagnosis: z.string().max(500).optional(),
  tags: z.string().optional(), // Can be parsed JSON or comma-separated string from form-data
  patientId: z.string().optional(), // For doctors uploading records on behalf of a patient
});

export const updateMedicalRecordSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  recordDate: z.string().optional(),
  doctorName: z.string().max(100).optional(),
  facilityName: z.string().max(150).optional(),
  description: z.string().max(1000).optional(),
  diagnosis: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
