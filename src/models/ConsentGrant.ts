import mongoose, { Document, Schema, Types } from 'mongoose';
import { IConsentScope, ScopeSchema } from './AccessRequest.js';

export type ConsentGrantStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface IConsentGrant extends Document {
  accessRequest: Types.ObjectId;
  patientUser: Types.ObjectId;
  patientId: string;
  doctorUser: Types.ObjectId;
  doctorId: string;
  doctorName: string;
  scope: IConsentScope;
  grantedAt: Date;
  expiresAt: Date;
  status: ConsentGrantStatus;
  revokedAt?: Date;
  revokedReason?: string;
  lastAccessedAt?: Date;
  accessCount: number;
  expiryNotified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentGrantSchema = new Schema<IConsentGrant>(
  {
    accessRequest: { type: Schema.Types.ObjectId, ref: 'AccessRequest', required: true, unique: true },
    patientUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    scope: { type: ScopeSchema, required: true },
    grantedAt: { type: Date, default: Date.now },
    // Mandatory. Checked at read time; documents are kept as consent evidence (no TTL index).
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], default: 'ACTIVE', index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, trim: true, maxlength: 500 },
    lastAccessedAt: { type: Date },
    accessCount: { type: Number, default: 0 },
    expiryNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ConsentGrantSchema.index({ doctorUser: 1, patientId: 1, status: 1, expiresAt: 1 });

export const ConsentGrant = mongoose.model<IConsentGrant>('ConsentGrant', ConsentGrantSchema);
