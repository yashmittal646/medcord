import mongoose, { Schema } from 'mongoose';
import { IAuditLog } from '../types/index.js';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['PATIENT', 'DOCTOR', 'SYSTEM'],
        required: true,
      },
    },
    targetPatientId: {
      type: String,
      index: true,
    },
    targetPatient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      enum: [
        'LOGIN',
        'PROFILE_UPDATE',
        'RECORD_UPLOAD',
        'RECORD_VIEW',
        'RECORD_DOWNLOAD',
        'RECORD_DELETE',
        'DOCTOR_LOOKUP',
        'HEALTH_PATH_CREATED',
        'HEALTH_PATH_UPDATED',
        'HEALTH_PATH_COMPLETED',
        'HEALTH_PATH_ARCHIVED',
        'EMERGENCY_ACCESS',
      ],
      required: true,
      index: true,
    },
    details: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable logs (no updates)
  }
);

AuditLogSchema.index({ targetPatientId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
