import { Types } from 'mongoose';
import { z } from 'zod';
import {
  AccessRequest,
  IAccessRequest,
  IConsentScope,
  CONSENT_DURATION_MS,
  ConsentDuration,
} from '../models/AccessRequest.js';
import { ConsentGrant } from '../models/ConsentGrant.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { User } from '../models/User.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AuditService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';
import { normalizeSpecialization } from '../config/taxonomy.js';
import { scopeSchema } from '../validators/accessRequest.validator.js';

type ScopeInput = z.infer<typeof scopeSchema>;
type AuditCtx = { ipAddress?: string; userAgent?: string };

const REQUEST_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const toScope = (s: ScopeInput): IConsentScope => ({
  recordIds: s.recordIds.map((id) => new Types.ObjectId(id)),
  categories: s.categories,
  conditions: s.conditions,
  specializations: s.specializations,
});

/** Every entry of `narrow` must already be in `orig` (the patient can only shrink a request) */
function isSubset(narrow: ScopeInput, orig: IConsentScope): boolean {
  const origIds = new Set(orig.recordIds.map((r) => r.toString()));
  return (
    narrow.recordIds.every((r) => origIds.has(r)) &&
    narrow.categories.every((c) => orig.categories.includes(c)) &&
    narrow.conditions.every((c) => orig.conditions.includes(c)) &&
    narrow.specializations.every((s) => orig.specializations.includes(s))
  );
}

async function actorName(userId: string, fallback: string) {
  const u = await User.findById(userId).select('name').lean();
  return u?.name ?? fallback;
}

export class AccessRequestService {
  /** Lapse unanswered requests so no one can approve a stale one */
  static async expireStale(): Promise<void> {
    await AccessRequest.updateMany(
      { status: 'PENDING', requestExpiresAt: { $lte: new Date() } },
      { status: 'EXPIRED' }
    );
  }

  static async create(
    doctor: IJwtPayload,
    input: { patientId: string; scope: ScopeInput; reason: string; requestedDuration: ConsentDuration },
    ctx: AuditCtx = {}
  ): Promise<IAccessRequest> {
    await this.expireStale();
    const patientId = input.patientId.trim().toUpperCase();

    const patientUser = await User.findOne({ publicId: patientId, role: 'PATIENT' });
    if (!patientUser) throw new AppError(`No patient found with ID '${patientId}'`, 404);

    // Record-level access sits on top of the patient-doctor connection
    if (!(await AccessGrantService.hasApprovedAccess(doctor.publicId, patientId))) {
      throw new AppError('You need an approved patient connection before requesting access to specific records.', 403);
    }

    const [doctorUser, profile] = await Promise.all([
      User.findById(doctor.userId),
      DoctorProfile.findOne({ user: doctor.userId }).lean(),
    ]);
    if (!doctorUser || !profile) throw new AppError('Doctor account not found', 404);

    // Records named explicitly must belong to this patient
    if (input.scope.recordIds.length) {
      const count = await MedicalRecord.countDocuments({ _id: { $in: input.scope.recordIds }, patientId });
      if (count !== new Set(input.scope.recordIds).size) {
        throw new AppError('One or more selected records were not found for this patient', 400);
      }
    }

    const ownSpec = normalizeSpecialization(profile.specialization);
    const onlyOwnSpec =
      input.scope.specializations.length > 0 &&
      input.scope.specializations.every((s) => s === ownSpec) &&
      !input.scope.recordIds.length &&
      !input.scope.categories.length &&
      !input.scope.conditions.length;
    if (onlyOwnSpec) {
      throw new AppError('Records in your own specialization are already available to you; no request is needed.', 400);
    }

    const pending = await AccessRequest.exists({
      doctorUser: doctorUser._id,
      patientUser: patientUser._id,
      status: 'PENDING',
    });
    if (pending) {
      throw new AppError('You already have a pending access request for this patient.', 409);
    }

    const request = await AccessRequest.create({
      patientUser: patientUser._id,
      patientId,
      doctorUser: doctorUser._id,
      doctorId: doctor.publicId,
      doctorName: doctorUser.name,
      doctorSpecialization: ownSpec ?? profile.specialization,
      scope: toScope(input.scope),
      reason: input.reason,
      requestedDuration: input.requestedDuration,
      requestExpiresAt: new Date(Date.now() + REQUEST_LIFETIME_MS),
    });

    await AuditService.log({
      actor: { userId: doctor.userId, publicId: doctor.publicId, name: doctorUser.name, role: 'DOCTOR' },
      targetPatientId: patientId,
      targetPatientUserId: patientUser._id.toString(),
      action: 'ACCESS_REQUEST_CREATED',
      details: JSON.stringify({
        requestId: request._id,
        scope: input.scope,
        duration: input.requestedDuration,
        reason: input.reason,
      }),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    await NotificationService.notify(patientUser._id, {
      type: 'ACCESS_REQUEST_RECEIVED',
      title: 'New access request',
      body: `${doctorUser.name} (${ownSpec ?? profile.specialization}) is asking to view some of your records.`,
      data: { requestId: request._id.toString() },
    });

    return request;
  }

  static async list(user: IJwtPayload, status?: string) {
    await this.expireStale();
    const filter: Record<string, unknown> =
      user.role === 'PATIENT' ? { patientUser: user.userId } : { doctorUser: user.userId };
    if (status) filter.status = status;
    return AccessRequest.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  }

  static async respond(
    patient: IJwtPayload,
    requestId: string,
    input: { decision: 'APPROVE' | 'REJECT'; duration?: ConsentDuration; narrowedScope?: ScopeInput },
    ctx: AuditCtx = {}
  ) {
    await this.expireStale();
    // Other accounts' requests look exactly like requests that do not exist
    if (!Types.ObjectId.isValid(requestId)) throw new AppError('Access request not found', 404);
    const existing = await AccessRequest.findOne({ _id: requestId, patientUser: patient.userId });
    if (!existing) throw new AppError('Access request not found', 404);

    let scope = existing.scope;
    if (input.decision === 'APPROVE' && input.narrowedScope) {
      if (!isSubset(input.narrowedScope, existing.scope)) {
        throw new AppError('You can only narrow a request, not widen it.', 400);
      }
      scope = toScope(input.narrowedScope);
    }

    // Atomic PENDING -> final transition: a double click or two tabs cannot respond twice
    const request = await AccessRequest.findOneAndUpdate(
      { _id: requestId, patientUser: patient.userId, status: 'PENDING', requestExpiresAt: { $gt: new Date() } },
      { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', respondedAt: new Date() },
      { new: true }
    );
    if (!request) {
      throw new AppError(`This request is no longer pending (it is ${existing.status.toLowerCase()}).`, 409);
    }

    const name = await actorName(patient.userId, patient.publicId);
    const actor = { userId: patient.userId, publicId: patient.publicId, name, role: 'PATIENT' as const };

    if (input.decision === 'REJECT') {
      await AuditService.log({
        actor,
        targetPatientId: patient.publicId,
        targetPatientUserId: patient.userId,
        action: 'ACCESS_REQUEST_REJECTED',
        details: JSON.stringify({ requestId, doctorId: request.doctorId }),
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      await NotificationService.notify(request.doctorUser, {
        type: 'ACCESS_REQUEST_REJECTED',
        title: 'Access request declined',
        body: `${name} declined your request for additional records.`,
        data: { requestId },
      });
      return { request, grant: null };
    }

    const expiresAt = new Date(Date.now() + CONSENT_DURATION_MS[input.duration!]);
    const grant = await ConsentGrant.create({
      accessRequest: request._id,
      patientUser: request.patientUser,
      patientId: request.patientId,
      doctorUser: request.doctorUser,
      doctorId: request.doctorId,
      doctorName: request.doctorName,
      scope,
      expiresAt,
    });

    await AuditService.log({
      actor,
      targetPatientId: patient.publicId,
      targetPatientUserId: patient.userId,
      action: 'CONSENT_GRANTED',
      details: JSON.stringify({
        requestId,
        grantId: grant._id,
        doctorId: request.doctorId,
        duration: input.duration,
        expiresAt,
        narrowed: Boolean(input.narrowedScope),
      }),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    await NotificationService.notify(request.doctorUser, {
      type: 'ACCESS_REQUEST_APPROVED',
      title: 'Access request approved',
      body: `${name} approved your request. Access lasts until ${expiresAt.toUTCString()}.`,
      data: { requestId, grantId: grant._id.toString() },
    });

    return { request, grant };
  }

  static async cancel(doctor: IJwtPayload, requestId: string) {
    if (!Types.ObjectId.isValid(requestId)) throw new AppError('Access request not found', 404);
    const request = await AccessRequest.findOneAndUpdate(
      { _id: requestId, doctorUser: doctor.userId, status: 'PENDING' },
      { status: 'CANCELLED', respondedAt: new Date() },
      { new: true }
    );
    if (!request) throw new AppError('Pending access request not found', 404);
    await AuditService.log({
      actor: {
        userId: doctor.userId,
        publicId: doctor.publicId,
        name: await actorName(doctor.userId, doctor.publicId),
        role: 'DOCTOR',
      },
      targetPatientId: request.patientId,
      targetPatientUserId: request.patientUser.toString(),
      action: 'ACCESS_REQUEST_CANCELLED',
      details: JSON.stringify({ requestId }),
    });
    return request;
  }
}
