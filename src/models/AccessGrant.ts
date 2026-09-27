import mongoose, { Document, Schema, Types } from 'mongoose';

export type AccessGrantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface IAccessGrant extends Document {
  patientUser: Types.ObjectId;
  patientId: string;
  doctorUser: Types.ObjectId;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorHospital?: string;
  reason: string;
  status: AccessGrantStatus;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const accessGrantSchema = new Schema<IAccessGrant>(
  {
    patientUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    doctorUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorSpecialization: {
      type: String,
      default: 'General Practice',
    },
    doctorHospital: {
      type: String,
      default: 'General Hospital',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active grants or pending requests
accessGrantSchema.index({ patientUser: 1, doctorUser: 1, status: 1 });
accessGrantSchema.index({ patientId: 1, doctorId: 1, status: 1 });

export const AccessGrant = mongoose.model<IAccessGrant>('AccessGrant', accessGrantSchema);
