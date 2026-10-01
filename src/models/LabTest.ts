import mongoose, { Schema, Types } from 'mongoose';

/** Investigations a doctor can order: a seeded catalogue plus each doctor's own custom tests */
export interface ILabTest {
  _id: Types.ObjectId;
  name: string;
  nameLower: string;
  category: string;
  /** Present for a doctor's custom test; such tests are only offered to that doctor */
  createdByDoctor?: Types.ObjectId;
}

const LabTestSchema = new Schema<ILabTest>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    nameLower: { type: String, required: true },
    category: { type: String, default: 'Other', trim: true },
    createdByDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

LabTestSchema.index({ nameLower: 1, createdByDoctor: 1 }, { unique: true });

LabTestSchema.pre('validate', function (next) {
  this.nameLower = this.name.toLowerCase().replace(/\s+/g, ' ').trim();
  next();
});

export const LabTest = mongoose.model<ILabTest>('LabTest', LabTestSchema);

/** Seeded at startup (idempotent) */
export const LAB_TEST_CATALOG: [string, string][] = [
  ['CBC (Complete Blood Count)', 'Blood'],
  ['ESR', 'Blood'],
  ['Peripheral Smear', 'Blood'],
  ['Blood Group & Rh', 'Blood'],
  ['Fasting Blood Sugar (FBS)', 'Diabetes'],
  ['Post-prandial Blood Sugar (PPBS)', 'Diabetes'],
  ['Random Blood Sugar (RBS)', 'Diabetes'],
  ['HbA1c', 'Diabetes'],
  ['Lipid Profile', 'Heart'],
  ['LFT (Liver Function Test)', 'Liver'],
  ['KFT (Kidney Function Test)', 'Kidney'],
  ['Serum Creatinine', 'Kidney'],
  ['Serum Electrolytes', 'Kidney'],
  ['Uric Acid', 'Kidney'],
  ['Thyroid Profile (T3, T4, TSH)', 'Thyroid'],
  ['TSH', 'Thyroid'],
  ['Vitamin D (25-OH)', 'Vitamins'],
  ['Vitamin B12', 'Vitamins'],
  ['Serum Ferritin', 'Iron'],
  ['Iron Studies', 'Iron'],
  ['Serum Calcium', 'Minerals'],
  ['CRP (C-Reactive Protein)', 'Inflammation'],
  ['Urine Routine & Microscopy', 'Urine'],
  ['Urine Culture', 'Urine'],
  ['Stool Routine', 'Stool'],
  ['Dengue NS1 Antigen', 'Infection'],
  ['Malaria Antigen', 'Infection'],
  ['Widal Test', 'Infection'],
  ['HIV 1 & 2', 'Infection'],
  ['HBsAg', 'Infection'],
  ['ECG', 'Heart'],
  ['2D Echo', 'Heart'],
  ['Chest X-ray', 'Imaging'],
  ['X-ray', 'Imaging'],
  ['Ultrasound Abdomen', 'Imaging'],
  ['Ultrasound', 'Imaging'],
  ['MRI', 'Imaging'],
  ['CT Scan', 'Imaging'],
  ['Pap Smear', 'Women'],
  ['PSA (Prostate-Specific Antigen)', 'Men'],
  ['Hormone Profile (FSH, LH, Prolactin)', 'Hormones'],
  ['Scalp Biopsy', 'Skin'],
];
