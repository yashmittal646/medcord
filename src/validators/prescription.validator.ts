import { z } from 'zod';
import { RX_FREQUENCIES, RX_DURATION_UNITS, LAB_TEST_STATUSES } from '../models/Prescription.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const optText = (max: number) => z.string().trim().max(max).optional();
/** Dosage per slot: 0, ½, 1, 1½ … up to 4 */
const dose = z.coerce
  .number()
  .min(0, 'Dosage must be 0 or more')
  .max(4, 'Dosage cannot be more than 4')
  .refine((n) => Number.isInteger(n * 2), 'Dosage must be a whole or half number');
const dateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Please enter a valid date');

export const letterheadSchema = z.object({
  header: z.object({
    doctorName: z.string().trim().min(2, 'Doctor name is required').max(120),
    qualification: optText(160),
    specialization: optText(120),
    registrationNumber: optText(60),
  }),
  footer: z.object({
    clinicName: optText(160),
    clinicAddress: z.string().trim().min(5, 'Clinic address is required').max(400),
    phone: z.string().trim().min(6, 'Contact number is required').max(40),
  }),
});

export const unlockLetterheadSchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: 'Please confirm that you want to edit your letterhead' }) }),
});

const medicineLine = z.object({
  medicineId: objectId,
  dosage: z.object({ morning: dose, afternoon: dose, night: dose }).default({ morning: 0, afternoon: 0, night: 0 }),
  frequency: z.enum(RX_FREQUENCIES).default('DAILY'),
  frequencyCustom: optText(80),
  duration: z
    .object({ value: z.coerce.number().int().min(1).max(365), unit: z.enum(RX_DURATION_UNITS) })
    .optional()
    .nullable(),
  timing: optText(120),
  note: optText(200),
});

const labTestLine = z
  .object({
    labTestId: objectId.optional(),
    name: z.string().trim().min(1).max(150).optional(),
    note: optText(200),
  })
  .refine((t) => Boolean(t.labTestId || t.name), { message: 'Choose a test or type its name' });

/** Drafts are saved as the doctor types, so every field is optional except the patient */
export const draftBodySchema = z.object({
  date: dateString.optional(),
  complaints: optText(2000),
  diagnosis: optText(500),
  comorbidities: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  medicines: z.array(medicineLine).max(40).optional(),
  labTests: z.array(labTestLine).max(40).optional(),
  nextVisitDate: dateString.optional().nullable(),
});

export const createDraftSchema = draftBodySchema.extend({
  patientId: z.string().trim().min(3, 'Please choose a patient').max(40),
});

export const duplicateSchema = z.object({
  patientId: z.string().trim().min(3).max(40).optional(),
});

export const labTestStatusSchema = z.object({ status: z.enum(LAB_TEST_STATUSES) });

export type DraftBody = z.infer<typeof draftBodySchema>;
