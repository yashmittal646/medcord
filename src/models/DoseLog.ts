import mongoose, { Schema, Document, Types } from 'mongoose';

export type DoseStatus = 'TAKEN' | 'SKIPPED' | 'MISSED' | 'SNOOZED';

export interface IDoseLog extends Document {
  _id: Types.ObjectId;
  /** Denormalized for fast queries – always set from JWT-resolved profile */
  patient: Types.ObjectId;
  patientId: string;
  medication: Types.ObjectId;
  medicationName: string; // snapshot at log time

  scheduledTime: string;   // "08:00" – intended schedule slot
  scheduledDate: Date;     // UTC midnight of the scheduled day

  status: DoseStatus;
  takenAt?: Date;          // actual timestamp when TAKEN
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DoseLogSchema = new Schema<IDoseLog>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: String, required: true, index: true },
    medication: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    medicationName: { type: String, required: true, trim: true },

    scheduledTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    scheduledDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ['TAKEN', 'SKIPPED', 'MISSED', 'SNOOZED'],
      required: true,
    },
    takenAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// One log entry per (medication, scheduled date+time slot) – prevents double-logging
DoseLogSchema.index(
  { medication: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true }
);
DoseLogSchema.index({ patientId: 1, scheduledDate: -1 });
DoseLogSchema.index({ medication: 1, scheduledDate: -1 });

export const DoseLog = mongoose.model<IDoseLog>('DoseLog', DoseLogSchema);
