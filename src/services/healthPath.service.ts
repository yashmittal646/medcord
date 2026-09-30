import { Types } from 'mongoose';
import { HealthPath } from '../models/HealthPath.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { User } from '../models/User.js';
import { AuditService } from './audit.service.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload, HealthPathStatus } from '../types/index.js';
import { CreateHealthPathInput, AddProgressNoteInput } from '../validators/healthPath.validator.js';

export class HealthPathService {
  static async createHealthPath(doctor: IJwtPayload, data: CreateHealthPathInput) {
    const cleanPatientId = data.patientId.trim().toUpperCase();

    const hasAccess = await AccessGrantService.hasApprovedAccess(doctor.publicId, cleanPatientId);
    if (!hasAccess) {
      throw new AppError('Access Denied: Patient consent is required before prescribing a Health Path.', 403);
    }

    const patientUser = await User.findOne({ publicId: cleanPatientId, role: 'PATIENT' });
    if (!patientUser) {
      throw new AppError(`Patient with ID '${cleanPatientId}' not found`, 404);
    }

    const doctorUser = await User.findById(doctor.userId);
    const doctorName = doctorUser ? doctorUser.name : 'Dr. Authorized';

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const expectedEndDate = data.expectedEndDate ? new Date(data.expectedEndDate) : undefined;

    const healthPath = await HealthPath.create({
      patient: patientUser._id,
      patientId: cleanPatientId,
      doctor: new Types.ObjectId(doctor.userId),
      doctorId: doctor.publicId,
      doctorName,
      condition: data.condition,
      description: data.description,
      startDate,
      expectedEndDate,
      status: 'ACTIVE',
      medications: data.medications || [],
      progressNotes: [],
    });

    // Sync medications to Patient's active profile
    if (data.medications && data.medications.length > 0) {
      const patientProfile = await PatientProfile.findOne({ user: patientUser._id });
      if (patientProfile) {
        data.medications.forEach((med) => {
          let calculatedEndDate: Date | undefined = undefined;
          if (med.durationDays) {
            calculatedEndDate = new Date(startDate.getTime() + med.durationDays * 24 * 60 * 60 * 1000);
          } else if (expectedEndDate) {
            calculatedEndDate = expectedEndDate;
          }

          patientProfile.currentMedications.push({
            medicine: med.medicine,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate,
            endDate: calculatedEndDate,
            status: 'ACTIVE',
            sourceHealthPathId: healthPath._id,
          });
        });

        await patientProfile.save();
      }
    }

    // Log the event
    await AuditService.log({
      actor: {
        userId: doctor.userId,
        publicId: doctor.publicId,
        name: doctorName,
        role: 'DOCTOR',
      },
      targetPatientId: cleanPatientId,
      targetPatientUserId: patientUser._id.toString(),
      action: 'HEALTH_PATH_CREATED',
      details: `Doctor ${doctorName} created active Health Path: '${data.condition}'`,
    });

    return healthPath;
  }

  static async getHealthPathsForPatient(
    requestingUser: IJwtPayload,
    patientId: string,
    status?: HealthPathStatus
  ) {
    patientId = (patientId || '').trim().toUpperCase();
    await AccessGrantService.assertPatientDataAccess(
      requestingUser,
      patientId,
      'Forbidden: You can only view your own Health Paths'
    );

    const query: any = { patientId };
    if (status) {
      query.status = status;
    }

    return HealthPath.find(query).sort({ status: 1, startDate: -1 });
  }

  static async getHealthPathById(requestingUser: IJwtPayload, pathId: string) {
    const healthPath = await HealthPath.findById(pathId);
    if (!healthPath) {
      throw new AppError('Health Path not found', 404);
    }

    await AccessGrantService.assertPatientDataAccess(
      requestingUser,
      healthPath.patientId,
      'Forbidden: You do not have access to this Health Path'
    );

    return healthPath;
  }

  static async updateStatus(
    requestingUser: IJwtPayload,
    pathId: string,
    newStatus: HealthPathStatus
  ) {
    const healthPath = await HealthPath.findById(pathId);
    if (!healthPath) {
      throw new AppError('Health Path not found', 404);
    }

    await AccessGrantService.assertPatientDataAccess(
      requestingUser,
      healthPath.patientId,
      'Forbidden: You can only update your own Health Paths'
    );

    healthPath.status = newStatus;
    if (newStatus === 'COMPLETED' || newStatus === 'ARCHIVED') {
      if (!healthPath.actualEndDate) {
        healthPath.actualEndDate = new Date();
      }

      // Synchronize medications in patient profile
      const patientProfile = await PatientProfile.findOne({ patientId: healthPath.patientId });
      if (patientProfile) {
        patientProfile.currentMedications.forEach((med) => {
          if (med.sourceHealthPathId && med.sourceHealthPathId.toString() === pathId) {
            med.status = 'COMPLETED';
            if (!med.endDate) med.endDate = new Date();
          }
        });
        await patientProfile.save();
      }
    }

    await healthPath.save();

    const userObj = await User.findById(requestingUser.userId);
    const actorName = userObj ? userObj.name : requestingUser.publicId;

    let auditAction: any = 'HEALTH_PATH_UPDATED';
    if (newStatus === 'COMPLETED') auditAction = 'HEALTH_PATH_COMPLETED';
    if (newStatus === 'ARCHIVED') auditAction = 'HEALTH_PATH_ARCHIVED';

    await AuditService.log({
      actor: {
        userId: requestingUser.userId,
        publicId: requestingUser.publicId,
        name: actorName,
        role: requestingUser.role,
      },
      targetPatientId: healthPath.patientId,
      action: auditAction,
      details: `${requestingUser.role} ${actorName} marked Health Path '${healthPath.condition}' as ${newStatus}`,
    });

    return healthPath;
  }

  static async addProgressNote(
    requestingUser: IJwtPayload,
    pathId: string,
    data: AddProgressNoteInput
  ) {
    const healthPath = await HealthPath.findById(pathId);
    if (!healthPath) {
      throw new AppError('Health Path not found', 404);
    }

    await AccessGrantService.assertPatientDataAccess(
      requestingUser,
      healthPath.patientId,
      'Forbidden: You can only comment on your own Health Paths'
    );

    const userObj = await User.findById(requestingUser.userId);
    const authorName = userObj ? userObj.name : requestingUser.publicId;

    healthPath.progressNotes.push({
      note: data.note,
      authorRole: requestingUser.role,
      authorName,
      createdAt: new Date(),
    });

    await healthPath.save();
    return healthPath;
  }
}
