import mongoose, { Document, Schema, Types } from 'mongoose';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type ConsentDuration = '24H' | '7D' | '30D';

export const CONSENT_DURATION_MS: Record<ConsentDuration, number> = {
  '24H': 24 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
  '30D': 30 * 24 * 60 * 60 * 1000,
};

/** What a request/consent covers. A record is covered if it matches ANY populated list. */
export interface IConsentScope {
  recordIds: Types.ObjectId[];
  categories: string[];
  conditions: string[];
  specializations: string[];
}

export interface IAccessRequest extends Document {
  patientUser: Types.ObjectId;
  patientId: string;
  doctorUser: Types.ObjectId;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  scope: IConsentScope;
  reason: string;
  requestedDuration: ConsentDuration;
  status: AccessRequestStatus;
  respondedAt?: Date;
  requestExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ScopeSchema = new Schema(
  {
    recordIds: [{ type: Schema.Types.ObjectId, ref: 'MedicalRecord' }],
    categories: [{ type: String }],
    conditions: [{ type: String }],
    specializations: [{ type: String }],
  },
  { _id: false }
);

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    patientUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpecialization: { type: String, required: true },
    scope: { type: ScopeSchema, required: true },
    reason: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    requestedDuration: { type: String, enum: ['24H', '7D', '30D'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    respondedAt: { type: Date },
    requestExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

AccessRequestSchema.index({ doctorUser: 1, patientUser: 1, status: 1 });
// At most one open request per doctor and patient, enforced by the database so simultaneous submits cannot both succeed
AccessRequestSchema.index(
  { doctorUser: 1, patientUser: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

export const AccessRequest = mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);
