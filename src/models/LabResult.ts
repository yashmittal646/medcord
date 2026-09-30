import mongoose, { Schema, Types } from 'mongoose';

export const LAB_RESULT_SOURCES = ['AI_EXTRACTED', 'MANUAL'] as const;
export type LabResultSource = (typeof LAB_RESULT_SOURCES)[number];

export interface ILabResult {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  patientId: string;
  /** The lab report this value was read from; absent for readings the patient typed in */
  record?: Types.ObjectId;
  /** Catalog key (e.g. HBA1C) or CUSTOM:<slug> for parameters outside the catalog */
  key: string;
  /** Name as printed on the report (or chosen by the patient) */
  name: string;
  value: number;
  unit: string;
  /** Reference range printed on the report, when there was one */
  refLow?: number;
  refHigh?: number;
  takenAt: Date;
  source: LabResultSource;
  createdAt: Date;
  updatedAt: Date;
}

const LabResultSchema = new Schema<ILabResult>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: String, required: true, trim: true },
    record: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: Number, required: true },
    unit: { type: String, trim: true, default: '', maxlength: 40 },
    refLow: { type: Number },
    refHigh: { type: Number },
    takenAt: { type: Date, required: true },
    source: { type: String, enum: LAB_RESULT_SOURCES, required: true },
  },
  { timestamps: true }
);

LabResultSchema.index({ patientId: 1, key: 1, takenAt: 1 });
LabResultSchema.index({ record: 1 });

export const LabResult = mongoose.model<ILabResult>('LabResult', LabResultSchema);
