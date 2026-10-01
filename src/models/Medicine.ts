import mongoose, { Schema, Types } from 'mongoose';
import { MEDICINE_FORMS, MedicineForm } from '../config/medicineForms.js';

export const MEDICINE_SOURCES = ['seed', 'doctor_added'] as const;
export const MEDICINE_SCOPES = ['global', 'doctor_private'] as const;

export interface IMedicine {
  _id: Types.ObjectId;
  brandName: string;
  /** Lowercased, single-spaced copy used for indexed prefix search */
  brandNameLower: string;
  genericName?: string;
  genericNameLower?: string;
  strength?: string;
  form: MedicineForm;
  manufacturer?: string;
  source: (typeof MEDICINE_SOURCES)[number];
  scope: (typeof MEDICINE_SCOPES)[number];
  createdByDoctor?: Types.ObjectId;
  isVerified: boolean;
  /** Set when an admin turns down a doctor-added medicine (it stays private to that doctor) */
  reviewedAt?: Date;
  /** brand|strength|manufacturer, lowercased: one catalogue entry per product */
  dedupeKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export const normalizeSearchText = (s: string | undefined | null) =>
  (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Doctor-private entries carry the doctor in their key so two doctors can each add "Mintop 5%" privately
 * without colliding with each other or with a later global import.
 */
export const medicineDedupeKey = (brand: string, strength?: string, manufacturer?: string, doctorId?: string) =>
  [normalizeSearchText(brand), normalizeSearchText(strength), normalizeSearchText(manufacturer), doctorId ? `doctor:${doctorId}` : '']
    .join('|')
    .replace(/\|+$/, '');

const MedicineSchema = new Schema<IMedicine>(
  {
    brandName: { type: String, required: true, trim: true, maxlength: 200 },
    brandNameLower: { type: String, required: true },
    genericName: { type: String, trim: true, maxlength: 500 },
    genericNameLower: { type: String },
    strength: { type: String, trim: true, maxlength: 80 },
    form: { type: String, enum: MEDICINE_FORMS, default: 'OTHER' },
    manufacturer: { type: String, trim: true, maxlength: 200 },
    source: { type: String, enum: MEDICINE_SOURCES, required: true },
    scope: { type: String, enum: MEDICINE_SCOPES, required: true },
    createdByDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
    isVerified: { type: Boolean, default: false },
    reviewedAt: { type: Date },
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Anchored, case-sensitive regexes on lowercase copies use these indexes for prefix search
MedicineSchema.index({ brandNameLower: 1 });
MedicineSchema.index({ genericNameLower: 1 });
MedicineSchema.index({ scope: 1, createdByDoctor: 1 });

MedicineSchema.pre('validate', function (next) {
  this.brandNameLower = normalizeSearchText(this.brandName);
  this.genericNameLower = this.genericName ? normalizeSearchText(this.genericName) : undefined;
  next();
});

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);
