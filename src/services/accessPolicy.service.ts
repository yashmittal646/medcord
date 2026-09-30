import { Types } from 'mongoose';
import { IMedicalRecord, IJwtPayload } from '../types/index.js';
import { IConsentScope } from '../models/AccessRequest.js';
import { ConsentGrant, IConsentGrant } from '../models/ConsentGrant.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { User } from '../models/User.js';
import {
  CATEGORY_DEFAULTS,
  RecordCategory,
  categoriesVisibleTo,
  normalizeSpecialization,
  Specialization,
} from '../config/taxonomy.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AuditService } from './audit.service.js';
import { AppError } from '../utils/appError.js';
import { isDoctorVerified } from './doctorVerification.service.js';

export type PolicyAction = 'READ' | 'DOWNLOAD';
export type DecisionVia = 'OWNER' | 'UPLOADER' | 'CONSENT' | 'SPECIALIZATION';

export interface Decision {
  allow: boolean;
  via?: DecisionVia;
  reason: string;
  grantId?: string;
}

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

const allow = (via: DecisionVia, reason: string, grantId?: string): Decision => ({ allow: true, via, reason, grantId });
const deny = (reason: string): Decision => ({ allow: false, reason });

/** Shown to the caller; the precise reason only goes into the audit log */
export const RECORD_DENIED_MESSAGE =
  'Access Denied: this record is outside your specialization or requires the patient’s consent. You can request access.';

/** True if the consent scope names this record (by id, category, condition or specialization) */
export function scopeCovers(scope: IConsentScope, record: IMedicalRecord): boolean {
  const c = record.classification;
  const id = record._id.toString();
  return (
    (scope.recordIds ?? []).some((r) => r.toString() === id) ||
    (scope.categories ?? []).includes(c?.category) ||
    (scope.conditions ?? []).some((k) => (c?.associatedConditions ?? []).includes(k)) ||
    (scope.specializations ?? []).some((s) => (c?.targetSpecializations ?? []).includes(s))
  );
}

/** Mongo equivalent of scopeCovers, or null if the scope is empty */
export function scopeToFilter(scope: IConsentScope): Record<string, unknown> | null {
  const or: Record<string, unknown>[] = [];
  if (scope.recordIds?.length) or.push({ _id: { $in: scope.recordIds } });
  if (scope.categories?.length) or.push({ 'classification.category': { $in: scope.categories } });
  if (scope.conditions?.length) or.push({ 'classification.associatedConditions': { $in: scope.conditions } });
  if (scope.specializations?.length) or.push({ 'classification.targetSpecializations': { $in: scope.specializations } });
  return or.length ? { $or: or } : null;
}

export class AccessPolicy {
  static async getDoctorSpecialization(doctorUserId: string): Promise<{ verified: boolean; spec?: Specialization }> {
    const profile = await DoctorProfile.findOne({ user: doctorUserId }).lean();
    return {
      verified: Boolean(profile) && isDoctorVerified(profile?.verificationStatus),
      spec: normalizeSpecialization(profile?.specialization),
    };
  }

  /** ACTIVE, unexpired, unrevoked consents (checked on every call, so revocation is immediate) */
  static async activeConsents(doctorUserId: string, patientId: string): Promise<IConsentGrant[]> {
    return ConsentGrant.find({
      doctorUser: new Types.ObjectId(doctorUserId),
      patientId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });
  }

  /** The single decision point for reading or downloading one record */
  static async evaluate(user: IJwtPayload, record: IMedicalRecord, _action: PolicyAction): Promise<Decision> {
    if (user.role === 'PATIENT') {
      return record.patientId === user.publicId ? allow('OWNER', 'OWNER') : deny('NOT_OWNER');
    }
    if (user.role !== 'DOCTOR') return deny('ROLE_NOT_ALLOWED');

    const { verified, spec } = await this.getDoctorSpecialization(user.userId);
    if (!verified) return deny('DOCTOR_NOT_VERIFIED');

    if (!(await AccessGrantService.hasApprovedAccess(user.publicId, record.patientId))) {
      return deny('NO_ACTIVE_CONNECTION');
    }

    if (record.uploadedBy.toString() === user.userId) return allow('UPLOADER', 'UPLOADED_BY_DOCTOR');

    const consents = await this.activeConsents(user.userId, record.patientId);
    const covering = consents.find((g) => scopeCovers(g.scope, record));
    if (covering) {
      await ConsentGrant.updateOne(
        { _id: covering._id },
        { $set: { lastAccessedAt: new Date() }, $inc: { accessCount: 1 } }
      );
      return allow('CONSENT', 'CONSENT_GRANT', covering._id.toString());
    }

    const c = record.classification;
    if (c?.sensitivityLevel === 'HIGHLY_CONFIDENTIAL') return deny('SENSITIVE_REQUIRES_CONSENT');
    if (!c || c.source === 'UNCLASSIFIED') {
      // Not tagged yet: visible to the specialties its document type implies (e.g. lab report -> General Practice).
      // "Other" documents have no default audience and stay with the patient until tagged.
      const defaults = CATEGORY_DEFAULTS[(c?.category ?? 'OTHER') as RecordCategory] ?? [];
      return spec && defaults.includes(spec) ? allow('SPECIALIZATION', 'CATEGORY_DEFAULT') : deny('UNCLASSIFIED');
    }
    if (spec && c.targetSpecializations.includes(spec)) return allow('SPECIALIZATION', 'SPECIALIZATION_MATCH');
    return deny('OUT_OF_SPECIALIZATION');
  }

  /**
   * Mongo filter for the records a requester may see for one patient. Used by every list-style
   * query (records, timeline, summary counts) so hidden records never appear in results or totals.
   */
  static async visibleRecordsFilter(user: IJwtPayload, patientId: string): Promise<Record<string, unknown>> {
    if (user.role === 'PATIENT') {
      if (user.publicId !== patientId) throw new AppError('Forbidden: You can only view your own medical records', 403);
      return { patientId };
    }
    if (user.role !== 'DOCTOR') throw new AppError('Forbidden', 403);

    const { verified, spec } = await this.getDoctorSpecialization(user.userId);
    if (!verified) throw new AppError('Forbidden: Your doctor account is pending verification.', 403);
    await AccessGrantService.assertPatientDataAccess(user, patientId, 'Forbidden');

    const or: Record<string, unknown>[] = [{ uploadedBy: new Types.ObjectId(user.userId) }];
    if (spec) {
      or.push({
        'classification.targetSpecializations': spec,
        'classification.sensitivityLevel': { $ne: 'HIGHLY_CONFIDENTIAL' },
        'classification.source': { $nin: ['UNCLASSIFIED', null] },
      });
      // Untagged records: same rule as evaluate() - the document type's default audience
      or.push({
        'classification.source': 'UNCLASSIFIED',
        'classification.sensitivityLevel': { $ne: 'HIGHLY_CONFIDENTIAL' },
        'classification.category': { $in: categoriesVisibleTo(spec) },
      });
    }
    for (const grant of await this.activeConsents(user.userId, patientId)) {
      const f = scopeToFilter(grant.scope);
      if (f) or.push(f);
    }
    return { patientId, $or: or };
  }

  /** Doctors may retract only their own upload, within 24h, while the connection is still active */
  static async canDelete(user: IJwtPayload, record: IMedicalRecord, now = new Date()): Promise<Decision> {
    if (user.role === 'PATIENT' && record.patientId === user.publicId) return allow('OWNER', 'OWNER');
    if (user.role === 'DOCTOR') {
      const withinWindow = now.getTime() - record.createdAt.getTime() < 24 * 60 * 60 * 1000;
      if (record.uploadedBy.toString() !== user.userId) return deny('NOT_UPLOADER');
      if (!withinWindow) return deny('DELETE_WINDOW_EXPIRED');
      if (!(await AccessGrantService.hasApprovedAccess(user.publicId, record.patientId))) return deny('NO_ACTIVE_CONNECTION');
      return allow('UPLOADER', 'OWN_UPLOAD_WITHIN_24H');
    }
    return deny('DELETE_NOT_PERMITTED');
  }

  /** Audit trail for record access: every doctor access, and every denial for anyone */
  static async audit(
    user: IJwtPayload,
    record: Pick<IMedicalRecord, 'patient' | 'patientId'> & { _id: Types.ObjectId },
    action: 'RECORD_VIEW' | 'RECORD_DOWNLOAD' | 'RECORD_DELETE',
    decision: Decision,
    ctx: AuditContext = {}
  ): Promise<void> {
    if (decision.allow && user.role !== 'DOCTOR' && action !== 'RECORD_DELETE') return;
    const actor = await User.findById(user.userId).select('name').lean();
    await AuditService.log({
      actor: { userId: user.userId, publicId: user.publicId, name: actor?.name ?? user.publicId, role: user.role },
      targetPatientId: record.patientId,
      targetPatientUserId: record.patient?.toString(),
      action: decision.allow ? action : 'RECORD_ACCESS_DENIED',
      details: JSON.stringify({
        recordId: record._id.toString(),
        attempted: action,
        decision: decision.allow ? 'ALLOW' : 'DENY',
        via: decision.via,
        reason: decision.reason,
        grantId: decision.grantId,
      }),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }
}
