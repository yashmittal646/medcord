import mongoose, { Schema } from 'mongoose';
import { IMedicalRecord } from '../types/index.js';

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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast timeline and filtered queries
MedicalRecordSchema.index({ patientId: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, recordType: 1 });

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
