import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'ACCESS_REQUEST_RECEIVED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'CONSENT_REVOKED'
  | 'CONSENT_EXPIRING'
  | 'RECORD_NEEDS_REVIEW'
  | 'CONNECTION_REQUESTED'
  | 'CONNECTION_RESPONDED';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  /** Deliberately free of clinical details: notifications can appear on lock screens and in email */
  body: string;
  data?: Record<string, string>;
  readAt?: Date | null;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 500 },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
