import mongoose, { Schema, Types } from 'mongoose';

/** A doctor's prescription letterhead: set up once, then locked and applied to every prescription */
export interface ILetterhead {
  header: {
    doctorName: string;
    qualification?: string;
    specialization?: string;
    registrationNumber?: string;
  };
  footer: {
    clinicName?: string;
    clinicAddress: string;
    phone: string;
  };
}

export interface IPrescriptionTemplate extends ILetterhead {
  _id: Types.ObjectId;
  doctor: Types.ObjectId;
  isLocked: boolean;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HEADER_FIELDS = {
  doctorName: { type: String, trim: true, maxlength: 120, default: '' },
  qualification: { type: String, trim: true, maxlength: 160 },
  specialization: { type: String, trim: true, maxlength: 120 },
  registrationNumber: { type: String, trim: true, maxlength: 60 },
};
const FOOTER_FIELDS = {
  clinicName: { type: String, trim: true, maxlength: 160 },
  clinicAddress: { type: String, trim: true, maxlength: 400, default: '' },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
};

export const LetterheadSchema = new Schema<ILetterhead>({ header: HEADER_FIELDS, footer: FOOTER_FIELDS }, { _id: false });

const PrescriptionTemplateSchema = new Schema<IPrescriptionTemplate>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    header: HEADER_FIELDS,
    footer: FOOTER_FIELDS,
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
  },
  { timestamps: true }
);

export const PrescriptionTemplate = mongoose.model<IPrescriptionTemplate>('PrescriptionTemplate', PrescriptionTemplateSchema);
