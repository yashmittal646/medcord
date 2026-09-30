import { Types } from 'mongoose';
import { AccessGrant, IAccessGrant, AccessGrantStatus } from '../models/AccessGrant.js';
import { User } from '../models/User.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { AuditService } from './audit.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload, AuditActionType } from '../types/index.js';
import { NotificationService } from './notification.service.js';

/** How long a patient's approval of a doctor connection lasts before it must be renewed */
export const CONNECTION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const isExpired = (g: { expiresAt?: Date | null }) => Boolean(g.expiresAt && g.expiresAt.getTime() <= Date.now());

export class AccessGrantService {
  /**
   * Doctor requests access to a patient's medical records
   */
  static async requestAccess(
    doctor: IJwtPayload,
    patientId: string,
    reason: string
  ): Promise<IAccessGrant> {
    if (!patientId || !patientId.trim()) {
      throw new AppError('Patient ID is required', 400);
    }
    if (!reason || !reason.trim()) {
      throw new AppError('Clinical reason/justification is mandatory for access request', 400);
    }

    const cleanPatientId = patientId.trim().toUpperCase();

    // Verify patient exists
    const patientUser = await User.findOne({ publicId: cleanPatientId, role: 'PATIENT' });
    if (!patientUser) {
      throw new AppError(`No patient found with ID '${cleanPatientId}'`, 404);
    }

    // Get doctor info
    const doctorUser = await User.findById(doctor.userId);
    if (!doctorUser) {
      throw new AppError('Doctor user account not found', 404);
    }

    const doctorProfile = await DoctorProfile.findOne({ user: doctor.userId });

    // Check if an existing grant exists
    const existingGrant = await AccessGrant.findOne({
      patientId: cleanPatientId,
      doctorId: doctor.publicId,
    }).sort({ createdAt: -1 });

    if (existingGrant && existingGrant.status === 'APPROVED' && !isExpired(existingGrant)) {
      // Already approved!
      return existingGrant;
    }

    if (existingGrant && existingGrant.status === 'PENDING') {
      // Update reason if updated
      existingGrant.reason = reason.trim();
      existingGrant.requestedAt = new Date();
      await existingGrant.save();
      return existingGrant;
    }

    // Create a new pending access grant
    const grant = await AccessGrant.create({
      patientUser: patientUser._id,
      patientId: cleanPatientId,
      doctorUser: doctorUser._id,
      doctorId: doctor.publicId,
      doctorName: doctorUser.name,
      doctorSpecialization: doctorProfile?.specialization || 'General Practitioner',
      doctorHospital: doctorProfile?.hospitalAffiliation || 'General Clinic',
      reason: reason.trim(),
      status: 'PENDING',
      requestedAt: new Date(),
    });

    // Audit log
    await AuditService.log({
      actor: {
        userId: doctor.userId,
        publicId: doctor.publicId,
        name: doctorUser.name,
        role: 'DOCTOR',
      },
      targetPatientId: cleanPatientId,
      targetPatientUserId: patientUser._id.toString(),
      action: 'CONNECTION_REQUESTED',
      details: `Doctor ${doctorUser.name} requested chart access: "${reason.trim()}"`,
    });
    await NotificationService.notify(patientUser._id, {
      type: 'CONNECTION_REQUESTED',
      title: 'A doctor wants to connect',
      body: `${doctorUser.name} asked for access to your health chart.`,
      data: { grantId: grant._id.toString(), doctorName: doctorUser.name },
    });

    return grant;
  }

  /**
   * Check if a doctor has an active APPROVED grant for a patient
   */
  static async hasApprovedAccess(doctorId: string, patientId: string): Promise<boolean> {
    const cleanPatientId = patientId.trim().toUpperCase();
    const cleanDoctorId = doctorId.trim().toUpperCase();

    const grant = await AccessGrant.findOne({
      patientId: cleanPatientId,
      doctorId: cleanDoctorId,
      status: 'APPROVED',
      // legacy grants have no expiry; new approvals always do
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    return !!grant;
  }

  /**
   * Single gate for reading or changing a patient's data.
   * Patients: own data only. Doctors: need an APPROVED grant. Any other role: denied.
   */
  static async assertPatientDataAccess(
    user: IJwtPayload,
    patientId: string,
    deniedMessage: string
  ): Promise<void> {
    const cleanPatientId = (patientId || '').trim().toUpperCase();
    if (user.role === 'PATIENT') {
      if (user.publicId !== cleanPatientId) throw new AppError(deniedMessage, 403);
      return;
    }
    if (user.role === 'DOCTOR') {
      const ok = await this.hasApprovedAccess(user.publicId, cleanPatientId);
      if (!ok) throw new AppError('Access Denied: Patient consent is required.', 403);
      return;
    }
    throw new AppError(deniedMessage, 403);
  }

  /**
   * Get current access status between a doctor and patient
   */
  static async getAccessStatus(doctor: IJwtPayload, patientId: string) {
    const cleanPatientId = patientId.trim().toUpperCase();
    const grant = await AccessGrant.findOne({
      patientId: cleanPatientId,
      doctorId: doctor.publicId,
    }).sort({ createdAt: -1 });

    const expired = Boolean(grant && grant.status === 'APPROVED' && isExpired(grant));
    return {
      patientId: cleanPatientId,
      hasAccess: grant?.status === 'APPROVED' && !expired,
      status: grant ? (expired ? 'EXPIRED' : grant.status) : 'NONE',
      grant,
    };
  }

  /**
   * Patient gets all their access requests and permissions
   */
  static async getPatientGrants(patient: IJwtPayload) {
    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient not found', 404);
    }

    const grants = await AccessGrant.find({
      patientUser: patientUser._id,
    }).sort({ requestedAt: -1 });

    const pending = grants.filter((g) => g.status === 'PENDING');
    const approved = grants.filter((g) => g.status === 'APPROVED' && !isExpired(g));
    const history = grants.filter(
      (g) => g.status === 'REJECTED' || g.status === 'REVOKED' || (g.status === 'APPROVED' && isExpired(g))
    );

    return {
      grants,
      pending,
      approved,
      history,
      totalPending: pending.length,
    };
  }

  /**
   * Patient approves, rejects, or revokes a doctor access request
   */
  static async respondToGrant(
    patient: IJwtPayload,
    grantId: string,
    decision: 'APPROVE' | 'REJECT' | 'REVOKE'
  ): Promise<IAccessGrant> {
    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient not found', 404);
    }

    const grant = await AccessGrant.findOne({
      _id: grantId,
      patientUser: patientUser._id,
    });

    if (!grant) {
      throw new AppError('Access request not found', 404);
    }

    const statusMap: Record<string, AccessGrantStatus> = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      REVOKE: 'REVOKED',
    };

    const newStatus = statusMap[decision];
    if (!newStatus) {
      throw new AppError('Invalid decision. Must be APPROVE, REJECT, or REVOKE', 400);
    }

    grant.status = newStatus;
    grant.respondedAt = new Date();
    if (newStatus === 'APPROVED') {
      grant.expiresAt = new Date(Date.now() + CONNECTION_TTL_MS);
    }
    await grant.save();

    // Audit log
    await AuditService.log({
      actor: {
        userId: patient.userId,
        publicId: patient.publicId,
        name: patientUser.name,
        role: 'PATIENT',
      },
      targetPatientId: patient.publicId,
      targetPatientUserId: patientUser._id.toString(),
      action: `CONNECTION_${newStatus === 'APPROVED' ? 'APPROVED' : newStatus === 'REJECTED' ? 'REJECTED' : 'REVOKED'}` as AuditActionType,
      details: `Patient ${decision.toLowerCase()}d access for ${grant.doctorName} (${grant.doctorId}).`,
    });
    await NotificationService.notify(grant.doctorUser, {
      type: 'CONNECTION_RESPONDED',
      title: 'Patient responded',
      body: `${patientUser.name} ${newStatus.toLowerCase()} your access request.`,
      data: { grantId: grant._id.toString(), patientName: patientUser.name, outcome: newStatus.toLowerCase() },
    });

    return grant;
  }
}
