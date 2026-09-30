import { z } from 'zod';
import { RECORD_CATEGORIES } from '../config/taxonomy.js';

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
  category: z.enum(RECORD_CATEGORIES).optional(),
  conditions: z.string().max(1000).optional(), // JSON array or comma-separated list of condition keys / labels
  sensitive: z.enum(['true', 'false']).optional(),
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

export const updateClassificationSchema = z.object({
  category: z.enum(RECORD_CATEGORIES).optional(),
  conditions: z.array(z.string()).max(20).default([]),
  sensitive: z.boolean().optional(),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
