import mongoose, { Schema } from 'mongoose';
import { IDoctorProfile } from '../types/index.js';

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required (e.g. Cardiology, General Medicine)'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Medical license number is required'],
      trim: true,
    },
    hospitalAffiliation: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED', // Default verified for smooth demo
    },
  },
  {
    timestamps: true,
  }
);

export const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);
