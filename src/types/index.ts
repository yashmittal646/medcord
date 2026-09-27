import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'SYSTEM';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
export type ConditionStatus = 'ACTIVE' | 'MANAGED' | 'RESOLVED';
export type MedicationStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type RecordType = 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSULTATION' | 'CHECKUP' | 'OTHER';
export type HealthPathStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type AuditActionType =
  | 'LOGIN'
  | 'PROFILE_UPDATE'
  | 'RECORD_UPLOAD'
  | 'RECORD_VIEW'
  | 'RECORD_DOWNLOAD'
  | 'RECORD_DELETE'
  | 'DOCTOR_LOOKUP'
  | 'HEALTH_PATH_CREATED'
  | 'HEALTH_PATH_UPDATED'
  | 'HEALTH_PATH_COMPLETED'
  | 'HEALTH_PATH_ARCHIVED'
  | 'EMERGENCY_ACCESS';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  publicId: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAllergy {
  _id?: Types.ObjectId;
  substance: string;
  severity: AllergySeverity;
  notes?: string;
  addedAt: Date;
}

export interface IChronicCondition {
  _id?: Types.ObjectId;
  condition: string;
  status: ConditionStatus;
  notes?: string;
  diagnosedDate?: Date;
}

export interface ICurrentMedication {
  _id?: Types.ObjectId;
  medicine: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
  endDate?: Date;
  status: MedicationStatus;
  sourceHealthPathId?: Types.ObjectId;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IPatientProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  patientId: string;
  dateOfBirth?: Date;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  emergencyContact?: IEmergencyContact;
  allergies: IAllergy[];
  chronicConditions: IChronicCondition[];
  currentMedications: ICurrentMedication[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  doctorId: string;
  specialization: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  publicCloudId?: string;
  storageType: 'cloudinary' | 'local';
}

export interface IMedicalRecord extends Document {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  patientId: string;
  uploadedBy: Types.ObjectId;
  uploaderRole: UserRole;
  recordType: RecordType;
  title: string;
  recordDate: Date;
  doctorName?: string;
  facilityName?: string;
  description?: string;
  diagnosis?: string;
  file?: IFileAttachment;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthPathMedication {
  _id?: Types.ObjectId;
  medicine: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  durationDays?: number;
}

export interface IHealthPathProgressNote {
  _id?: Types.ObjectId;
  note: string;
  authorRole: UserRole;
  authorName: string;
  createdAt: Date;
}

export interface IHealthPath extends Document {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  patientId: string;
  doctor: Types.ObjectId;
  doctorId: string;
  doctorName: string;
  condition: string;
  description?: string;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  status: HealthPathStatus;
  medications: IHealthPathMedication[];
  progressNotes: IHealthPathProgressNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: {
    userId: Types.ObjectId;
    publicId: string;
    name: string;
    role: UserRole;
  };
  targetPatientId?: string;
  targetPatient?: Types.ObjectId;
  action: AuditActionType;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  publicId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
}
