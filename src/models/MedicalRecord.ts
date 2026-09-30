import mongoose, { Schema } from 'mongoose';
import { IMedicalRecord } from '../types/index.js';
import {
  RECORD_CATEGORIES,
  RECORD_TYPE_TO_CATEGORY,
  SPECIALIZATIONS,
  SENSITIVITY_LEVELS,
  CLASSIFICATION_SOURCES,
} from '../config/taxonomy.js';

const ClassificationSchema = new Schema(
  {
    category: { type: String, enum: RECORD_CATEGORIES, default: 'OTHER' },
    associatedConditions: [{ type: String, lowercase: true, trim: true }],
    targetSpecializations: [{ type: String, enum: SPECIALIZATIONS }],
    sensitivityLevel: { type: String, enum: SENSITIVITY_LEVELS, default: 'STANDARD' },
    source: { type: String, enum: CLASSIFICATION_SOURCES, default: 'UNCLASSIFIED' },
    confidence: { type: Number, min: 0, max: 1 },
    patientReviewed: { type: Boolean, default: false },
  },
  { _id: false }
);

const FileAttachmentSchema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  url: { type: String },
  publicCloudId: { type: String },
  storageType: {
    type: String,
    enum: ['cloudinary', 'local'],
    default: 'local',
  },
  deliveryType: {
    type: String,
    enum: ['authenticated', 'public'],
    default: 'public',
  },
});

const MedicalRecordSchema = new Schema<IMedicalRecord>(
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
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploaderRole: {
      type: String,
      enum: ['PATIENT', 'DOCTOR'],
      required: true,
    },
    recordType: {
      type: String,
      enum: ['PRESCRIPTION', 'LAB_REPORT', 'CONSULTATION', 'CHECKUP', 'OTHER'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    recordDate: {
      type: Date,
      required: [true, 'Record date is required'],
      default: Date.now,
      index: true,
    },
    doctorName: {
      type: String,
      trim: true,
    },
    facilityName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    file: FileAttachmentSchema,
    tags: [{ type: String, trim: true }],
    // Absent on legacy documents until the startup backfill runs. UNCLASSIFIED records are visible to the
    // default audience of their category (see CATEGORY_DEFAULTS); "Other" documents stay with the patient.
    classification: { type: ClassificationSchema, default: () => ({}) },
    // Health Tracker: whether test values have been read out of this report (only when the patient asks)
    labExtraction: {
      status: { type: String, enum: ['DONE', 'NO_VALUES', 'FAILED', 'UNSUPPORTED'] },
      extractedAt: { type: Date },
      valueCount: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast timeline and filtered queries
// An untagged record takes its category from its record type (e.g. LAB_REPORT -> BLOOD_WORK), so the
// default-audience rule for untagged records applies even when a caller creates one without tags.
MedicalRecordSchema.pre('validate', function (next) {
  const c = (this as any).classification;
  if (c && c.source === 'UNCLASSIFIED' && (!c.category || c.category === 'OTHER')) {
    c.category = RECORD_TYPE_TO_CATEGORY[(this as any).recordType] ?? 'OTHER';
  }
  next();
});

MedicalRecordSchema.index({ patientId: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, recordType: 1 });
MedicalRecordSchema.index({ patientId: 1, 'classification.targetSpecializations': 1 });
MedicalRecordSchema.index({ patientId: 1, 'classification.associatedConditions': 1 });

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
