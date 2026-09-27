import mongoose, { Schema } from 'mongoose';
import { IPatientProfile, IAllergy, IChronicCondition, ICurrentMedication, IEmergencyContact } from '../types/index.js';

const AllergySchema = new Schema<IAllergy>({
  substance: {
    type: String,
    required: [true, 'Allergy substance/medicine name is required'],
    trim: true,
  },
  severity: {
    type: String,
    enum: ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'],
    default: 'MODERATE',
  },
  notes: {
    type: String,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const ChronicConditionSchema = new Schema<IChronicCondition>({
  condition: {
    type: String,
    required: [true, 'Condition name is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MANAGED', 'RESOLVED'],
    default: 'ACTIVE',
  },
  notes: {
    type: String,
    trim: true,
  },
  diagnosedDate: {
    type: Date,
  },
});

const CurrentMedicationSchema = new Schema<ICurrentMedication>({
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
    required: [true, 'Frequency is required (e.g. Twice daily after food)'],
    trim: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED'],
    default: 'ACTIVE',
  },
  sourceHealthPathId: {
    type: Schema.Types.ObjectId,
    ref: 'HealthPath',
  },
});

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
});

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    emergencyContact: EmergencyContactSchema,
    allergies: [AllergySchema],
    chronicConditions: [ChronicConditionSchema],
    currentMedications: [CurrentMedicationSchema],
  },
  {
    timestamps: true,
  }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);
