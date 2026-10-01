import mongoose, { Schema, Types } from 'mongoose';

/** Per-doctor "recently used" and favourite medicines, shown before the doctor starts typing */
export interface IDoctorMedicineUsage {
  _id: Types.ObjectId;
  doctor: Types.ObjectId;
  medicine: Types.ObjectId;
  useCount: number;
  lastUsedAt?: Date;
  favourite: boolean;
}

const DoctorMedicineUsageSchema = new Schema<IDoctorMedicineUsage>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    useCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    favourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DoctorMedicineUsageSchema.index({ doctor: 1, medicine: 1 }, { unique: true });
DoctorMedicineUsageSchema.index({ doctor: 1, favourite: -1, lastUsedAt: -1 });

export const DoctorMedicineUsage = mongoose.model<IDoctorMedicineUsage>('DoctorMedicineUsage', DoctorMedicineUsageSchema);
