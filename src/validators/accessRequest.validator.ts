import { z } from 'zod';
import { RECORD_CATEGORIES, SPECIALIZATIONS, CONDITION_ROUTING } from '../config/taxonomy.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid record id');

export const scopeSchema = z
  .object({
    recordIds: z.array(objectId).max(100).default([]),
    categories: z.array(z.enum(RECORD_CATEGORIES)).max(20).default([]),
    conditions: z
      .array(z.string().refine((k) => k in CONDITION_ROUTING, 'Unknown condition'))
      .max(50)
      .default([]),
    specializations: z.array(z.enum(SPECIALIZATIONS)).max(20).default([]),
  })
  .refine(
    (s) => s.recordIds.length + s.categories.length + s.conditions.length + s.specializations.length > 0,
    'Select at least one record, category, condition or specialization'
  );

export const createAccessRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  scope: scopeSchema,
  reason: z.string().trim().min(10, 'Please give a clinical reason (at least 10 characters)').max(1000),
  requestedDuration: z.enum(['24H', '7D', '30D']),
});

export const respondAccessRequestSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    // Mandatory when approving: the patient always chooses how long access lasts
    duration: z.enum(['24H', '7D', '30D']).optional(),
    narrowedScope: scopeSchema.optional(),
  })
  .refine((v) => v.decision === 'REJECT' || Boolean(v.duration), {
    message: 'Choose how long access should last (24H, 7D or 30D)',
    path: ['duration'],
  });

export const revokeConsentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
