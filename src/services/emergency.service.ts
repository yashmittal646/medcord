import { User } from '../models/User.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { HealthPath } from '../models/HealthPath.js';
import { AuditService } from './audit.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';

export interface EmergencyAccessOptions {
  ipAddress?: string;
  userAgent?: string;
  emergencyReason?: string;
}

export class EmergencyService {
  static async getEmergencySnapshot(
    doctor: IJwtPayload,
    patientId: string,
    options: EmergencyAccessOptions = {}
  ) {
    if (doctor.role !== 'DOCTOR') {
      throw new AppError('Forbidden: Only authorized medical practitioners can invoke Emergency Access', 403);
    }

    if (!patientId || !patientId.trim()) {
      throw new AppError('Patient ID is required for emergency access', 400);
    }

    const cleanPatientId = patientId.trim().toUpperCase();

    const patientUser = await User.findOne({ publicId: cleanPatientId, role: 'PATIENT' });
    if (!patientUser) {
      throw new AppError(`Emergency lookup failed: No patient found with ID '${cleanPatientId}'`, 404);
    }

    const profile = await PatientProfile.findOne({ user: patientUser._id });
    if (!profile) {
      throw new AppError('Emergency lookup failed: Patient medical profile not initialized', 404);
    }

    // Retrieve active health paths (ongoing treatments)
    const activePaths = await HealthPath.find({
      patientId: cleanPatientId,
      status: 'ACTIVE',
    }).select('condition doctorName startDate expectedEndDate');

    const doctorUser = await User.findById(doctor.userId);
    const doctorName = doctorUser ? doctorUser.name : 'Dr. Emergency';

    // High-priority audit record
    await AuditService.log({
      actor: {
        userId: doctor.userId,
        publicId: doctor.publicId,
        name: doctorName,
        role: 'DOCTOR',
      },
      targetPatientId: cleanPatientId,
      targetPatientUserId: patientUser._id.toString(),
      action: 'EMERGENCY_ACCESS',
      details: options.emergencyReason || `EMERGENCY ACCESS triggered by ${doctorName} (${doctor.publicId})`,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    // Calculate age if DOB present
    let age: number | undefined = undefined;
    if (profile.dateOfBirth) {
      const diffMs = Date.now() - new Date(profile.dateOfBirth).getTime();
      const ageDt = new Date(diffMs);
      age = Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    // Return the clean, life-saving critical summary
    return {
      emergencyAccessTimestamp: new Date().toISOString(),
      accessedByDoctor: {
        name: doctorName,
        doctorId: doctor.publicId,
      },
      patient: {
        name: patientUser.name,
        patientId: cleanPatientId,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        age,
        dateOfBirth: profile.dateOfBirth,
        emergencyContact: profile.emergencyContact,
      },
      criticalAllergies: profile.allergies.map((a) => ({
        substance: a.substance,
        severity: a.severity,
        notes: a.notes,
      })),
      currentActiveMedications: profile.currentMedications
        .filter((m) => m.status === 'ACTIVE')
        .map((m) => ({
          medicine: m.medicine,
          dosage: m.dosage,
          frequency: m.frequency,
          startDate: m.startDate,
        })),
      chronicConditions: profile.chronicConditions
        .filter((c) => c.status === 'ACTIVE' || c.status === 'MANAGED')
        .map((c) => ({
          condition: c.condition,
          status: c.status,
          notes: c.notes,
        })),
      activeTreatmentPaths: activePaths.map((p) => ({
        treatment: p.condition,
        supervisingDoctor: p.doctorName,
        startDate: p.startDate,
      })),
    };
  }
}
