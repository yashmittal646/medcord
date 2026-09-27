import mongoose, { Schema } from 'mongoose';
import { IHealthPath, IHealthPathMedication, IHealthPathProgressNote } from '../types/index.js';

const HealthPathMedicationSchema = new Schema<IHealthPathMedication>({
  medicine: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required (e.g. 500mg)'],
    trim: true,
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required (e.g. Twice daily after meals)'],
    trim: true,
  },
  instructions: {
    type: String,
    trim: true,
  },
  durationDays: {
    type: Number,
  },
});

const HealthPathProgressNoteSchema = new Schema<IHealthPathProgressNote>({
  note: {
    type: String,
    required: [true, 'Progress note text is required'],
    trim: true,
  },
  authorRole: {
    type: String,
    enum: ['PATIENT', 'DOCTOR'],
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HealthPathSchema = new Schema<IHealthPath>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
      trim: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition/treatment course name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedEndDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    medications: [HealthPathMedicationSchema],
    progressNotes: [HealthPathProgressNoteSchema],
  },
  {
    timestamps: true,
  }
);

HealthPathSchema.index({ patientId: 1, status: 1 });

export const HealthPath = mongoose.model<IHealthPath>('HealthPath', HealthPathSchema);
