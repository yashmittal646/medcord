import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { TimelineService } from './timeline.service.js';
import { RecordService } from './record.service.js';
import { AuditService } from './audit.service.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';

export interface DoctorLookupOptions {
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export class DoctorService {
  static async lookupPatient(
    doctor: IJwtPayload,
    patientId: string,
    options: DoctorLookupOptions = {}
  ) {
    if (!patientId || !patientId.trim()) {
      throw new AppError('Patient ID is required for lookup', 400);
    }

    const cleanPatientId = patientId.trim().toUpperCase();

    // Verify patient exists
    const patientUser = await User.findOne({ publicId: cleanPatientId, role: 'PATIENT' });
    if (!patientUser) {
      throw new AppError(`No patient found with ID '${cleanPatientId}'`, 404);
    }

    const profile = await PatientProfile.findOne({ user: patientUser._id });
    if (!profile) {
      throw new AppError('Patient profile not initialized', 404);
    }

    // Check if doctor has approved access
    const hasAccess = await AccessGrantService.hasApprovedAccess(doctor.publicId, cleanPatientId);
    const accessStatus = await AccessGrantService.getAccessStatus(doctor, cleanPatientId);

    if (!hasAccess) {
      // If reason provided and not already pending, automatically create a request
      let currentGrant: any = accessStatus.grant;
      if (options.reason && (!currentGrant || currentGrant.status === 'REJECTED' || currentGrant.status === 'REVOKED')) {
        currentGrant = await AccessGrantService.requestAccess(doctor, cleanPatientId, options.reason);
      }

      return {
        patientId: cleanPatientId,
        patientName: patientUser.name,
        accessGranted: false,
        status: currentGrant ? currentGrant.status : 'NONE',
        message: 'Patient consent is required before accessing full medical chart.',
        grant: currentGrant,
      };
    }

    // Get doctor user details for audit log
    const doctorUser = await User.findById(doctor.userId);
    const doctorName = doctorUser ? doctorUser.name : 'Dr. Authorized';

    // Log the doctor access event
    await AuditService.log({
      actor: {
        userId: doctor.userId,
        publicId: doctor.publicId,
        name: doctorName,
        role: 'DOCTOR',
      },
      targetPatientId: cleanPatientId,
      targetPatientUserId: patientUser._id.toString(),
      action: 'DOCTOR_LOOKUP',
      details: options.reason || `Doctor ${doctorName} (${doctor.publicId}) viewed patient chart.`,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    // Generate comprehensive summary
    const summary = await TimelineService.getPatientSummary(doctor, cleanPatientId);

    return {
      patientId: cleanPatientId,
      patientName: patientUser.name,
      accessGranted: true,
      summary,
    };
  }

  static async getPatientTimeline(
    doctor: IJwtPayload,
    patientId: string,
    filters: any = {}
  ) {
    const hasAccess = await AccessGrantService.hasApprovedAccess(doctor.publicId, patientId);
    if (!hasAccess) {
      throw new AppError('Access Denied: Patient consent is required to view timeline.', 403);
    }
    return TimelineService.getPatientTimeline(doctor, patientId, filters);
  }

  static async getPatientRecords(
    doctor: IJwtPayload,
    patientId: string,
    filters: any = {}
  ) {
    const hasAccess = await AccessGrantService.hasApprovedAccess(doctor.publicId, patientId);
    if (!hasAccess) {
      throw new AppError('Access Denied: Patient consent is required to view medical records.', 403);
    }
    return RecordService.getRecordsForPatient(doctor, patientId, filters);
  }

  static async createConsultation(
    doctor: IJwtPayload,
    patientId: string,
    data: {
      title: string;
      diagnosis: string;
      description?: string;
      facilityName?: string;
      recordDate?: string;
      file?: Express.Multer.File;
    }
  ) {
    const hasAccess = await AccessGrantService.hasApprovedAccess(doctor.publicId, patientId);
    if (!hasAccess) {
      throw new AppError('Access Denied: Patient consent is required to upload consultation notes.', 403);
    }

    const doctorUser = await User.findById(doctor.userId);
    const doctorName = doctorUser ? doctorUser.name : 'Doctor';

    return RecordService.createRecord(
      doctor,
      {
        patientId,
        recordType: 'CONSULTATION',
        title: data.title,
        diagnosis: data.diagnosis,
        description: data.description,
        facilityName: data.facilityName,
        doctorName,
        recordDate: data.recordDate,
      },
      data.file
    );
  }
}
