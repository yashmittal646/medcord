export type UserRole = 'PATIENT' | 'DOCTOR' | 'SYSTEM';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
export type ConditionStatus = 'ACTIVE' | 'MANAGED' | 'RESOLVED';
export type MedicationStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type RecordType = 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSULTATION' | 'CHECKUP' | 'OTHER';
export type HealthPathStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  publicId: string;
  status?: string;
}

export interface IAllergy {
  _id?: string;
  substance: string;
  severity: AllergySeverity;
  notes?: string;
  addedAt?: string;
}

export interface IChronicCondition {
  _id?: string;
  condition: string;
  status: ConditionStatus;
  notes?: string;
  diagnosedDate?: string;
}

export interface ICurrentMedication {
  _id?: string;
  medicine: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  status: MedicationStatus;
  sourceHealthPathId?: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IPatientProfile {
  _id?: string;
  user: string | IUser;
  patientId: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  emergencyContact?: IEmergencyContact;
  allergies: IAllergy[];
  chronicConditions: IChronicCondition[];
  currentMedications: ICurrentMedication[];
}

export interface IDoctorProfile {
  _id?: string;
  user: string | IUser;
  doctorId: string;
  specialization: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  verificationStatus: string;
}

export interface IMedicalRecord {
  _id: string;
  patient: string;
  patientId: string;
  uploadedBy: {
    _id?: string;
    name: string;
    publicId: string;
    role: UserRole;
  };
  uploaderRole: UserRole;
  recordType: RecordType;
  title: string;
  recordDate: string;
  doctorName?: string;
  facilityName?: string;
  description?: string;
  diagnosis?: string;
  file?: {
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url?: string;
    storageType: string;
  };
  tags?: string[];
  createdAt: string;
}

export interface IHealthPathMedication {
  _id?: string;
  medicine: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  durationDays?: number;
}

export interface IHealthPathProgressNote {
  _id?: string;
  note: string;
  authorRole: UserRole;
  authorName: string;
  createdAt: string;
}

export interface IHealthPath {
  _id: string;
  patient: string;
  patientId: string;
  doctor: string;
  doctorId: string;
  doctorName: string;
  condition: string;
  description?: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status: HealthPathStatus;
  medications: IHealthPathMedication[];
  progressNotes: IHealthPathProgressNote[];
  createdAt: string;
}

export interface IAuditActivity {
  id: string;
  action: string;
  badge: 'DOCTOR_VIEW' | 'EMERGENCY' | 'HEALTH_PATH' | 'RECORD' | 'GENERAL';
  message: string;
  details?: string;
  actor: {
    name: string;
    role: UserRole;
    publicId: string;
  };
  timestamp: string;
}

export interface IEmergencySnapshot {
  emergencyAccessTimestamp: string;
  accessedByDoctor: {
    name: string;
    doctorId: string;
  };
  patient: {
    name: string;
    patientId: string;
    gender?: string;
    bloodGroup: string;
    age?: number;
    dateOfBirth?: string;
    emergencyContact?: IEmergencyContact;
  };
  criticalAllergies: {
    substance: string;
    severity: AllergySeverity;
    notes?: string;
  }[];
  currentActiveMedications: {
    medicine: string;
    dosage: string;
    frequency: string;
    startDate?: string;
  }[];
  chronicConditions: {
    condition: string;
    status: ConditionStatus;
    notes?: string;
  }[];
  activeTreatmentPaths: {
    treatment: string;
    supervisingDoctor: string;
    startDate: string;
  }[];
}
