import mongoose, { Schema, Types } from 'mongoose';
import { LetterheadSchema, ILetterhead } from './PrescriptionTemplate.js';
import { MEDICINE_FORMS, MedicineForm } from '../config/medicineForms.js';

export const RX_FREQUENCIES = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'SOS', 'CUSTOM'] as const;
export const RX_DURATION_UNITS = ['DAYS', 'WEEKS', 'MONTHS'] as const;
export const RX_STATUSES = ['DRAFT', 'ISSUED', 'SUPERSEDED'] as const;
export const LAB_TEST_STATUSES = ['PENDING', 'UPLOADED', 'DONE'] as const;

export type RxFrequency = (typeof RX_FREQUENCIES)[number];
export type RxDurationUnit = (typeof RX_DURATION_UNITS)[number];
export type RxStatus = (typeof RX_STATUSES)[number];
export type LabTestStatus = (typeof LAB_TEST_STATUSES)[number];

/**
 * One medicine line. Name/strength/form/generic are copied from the catalogue when the line is saved, so an
 * issued prescription never changes if the catalogue entry is later edited.
 */
export interface IRxMedicine {
  _id: Types.ObjectId;
  medicine: Types.ObjectId;
  name: string;
  strength?: string;
  form: MedicineForm;
  genericName?: string;
  dosage: { morning: number; afternoon: number; night: number };
  frequency: RxFrequency;
  frequencyCustom?: string;
  duration?: { value: number; unit: RxDurationUnit };
  timing?: string;
  note?: string;
  order: number;
}

export interface IRxLabTest {
  _id: Types.ObjectId;
  labTest?: Types.ObjectId;
  name: string;
  note?: string;
  status: LabTestStatus;
  order: number;
}

export interface IPrescription {
  _id: Types.ObjectId;
  doctor: Types.ObjectId;
  doctorId: string;
  patient: Types.ObjectId;
  patientId: string;
  /** Name/age/sex as printed on the issued prescription */
  patientSnapshot?: { name: string; age?: number; gender?: string };
  date: Date;
  complaints?: string;
  diagnosis?: string;
  comorbidities: string[];
  medicines: IRxMedicine[];
  labTests: IRxLabTest[];
  nextVisitDate?: Date;
  status: RxStatus;
  version: number;
  /** First version of this prescription; all amendments share it */
  rootId: Types.ObjectId;
  amendsId?: Types.ObjectId;
  supersededBy?: Types.ObjectId;
  /** Letterhead copied at issue time */
  letterhead?: ILetterhead;
  issuedAt?: Date;
  /** The patient's MedicalRecord that represents this prescription in their records and timeline */
  record?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RxMedicineSchema = new Schema<IRxMedicine>({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  strength: { type: String, trim: true, maxlength: 80 },
  form: { type: String, enum: MEDICINE_FORMS, default: 'OTHER' },
  genericName: { type: String, trim: true, maxlength: 500 },
  dosage: {
    morning: { type: Number, min: 0, max: 10, default: 0 },
    afternoon: { type: Number, min: 0, max: 10, default: 0 },
    night: { type: Number, min: 0, max: 10, default: 0 },
  },
  frequency: { type: String, enum: RX_FREQUENCIES, default: 'DAILY' },
  frequencyCustom: { type: String, trim: true, maxlength: 80 },
  duration: {
    value: { type: Number, min: 1, max: 365 },
    unit: { type: String, enum: RX_DURATION_UNITS },
  },
  timing: { type: String, trim: true, maxlength: 120 },
  note: { type: String, trim: true, maxlength: 200 },
  order: { type: Number, default: 0 },
});

const RxLabTestSchema = new Schema<IRxLabTest>({
  labTest: { type: Schema.Types.ObjectId, ref: 'LabTest' },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  note: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: LAB_TEST_STATUSES, default: 'PENDING' },
  order: { type: Number, default: 0 },
});

const PrescriptionSchema = new Schema<IPrescription>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: String, required: true, trim: true },
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: String, required: true, trim: true },
    patientSnapshot: {
      name: { type: String },
      age: { type: Number },
      gender: { type: String },
    },
    date: { type: Date, required: true, default: Date.now },
    complaints: { type: String, trim: true, maxlength: 2000 },
    diagnosis: { type: String, trim: true, maxlength: 500 },
    comorbidities: [{ type: String, trim: true, maxlength: 80 }],
    medicines: [RxMedicineSchema],
    labTests: [RxLabTestSchema],
    nextVisitDate: { type: Date },
    status: { type: String, enum: RX_STATUSES, default: 'DRAFT' },
    version: { type: Number, default: 1 },
    rootId: { type: Schema.Types.ObjectId, required: true },
    amendsId: { type: Schema.Types.ObjectId },
    supersededBy: { type: Schema.Types.ObjectId },
    letterhead: { type: LetterheadSchema },
    issuedAt: { type: Date },
    record: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
  },
  { timestamps: true }
);

PrescriptionSchema.index({ doctor: 1, patientId: 1, date: -1 });
PrescriptionSchema.index({ doctor: 1, status: 1, updatedAt: -1 });
PrescriptionSchema.index({ patient: 1, status: 1, issuedAt: -1 });
PrescriptionSchema.index({ rootId: 1, version: 1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
