import { Types } from 'mongoose';
import { ConsentGrant } from '../models/ConsentGrant.js';
import { AuditService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';

const EXPIRING_SOON_MS = 60 * 60 * 1000;

export class ConsentService {
  /** Flips lapsed grants to EXPIRED and records it. Reads never depend on this: expiresAt is always checked. */
  static async expireStale(): Promise<void> {
    const stale = await ConsentGrant.find({ status: 'ACTIVE', expiresAt: { $lte: new Date() } });
    for (const grant of stale) {
      const res = await ConsentGrant.updateOne({ _id: grant._id, status: 'ACTIVE' }, { status: 'EXPIRED' });
      if (res.modifiedCount === 0) continue;
      await AuditService.log({
        actor: { userId: grant.patientUser.toString(), publicId: 'SYSTEM', name: 'System', role: 'SYSTEM' },
        targetPatientId: grant.patientId,
        targetPatientUserId: grant.patientUser.toString(),
        action: 'CONSENT_EXPIRED',
        details: JSON.stringify({ grantId: grant._id, doctorId: grant.doctorId }),
      });
    }
  }

  static async listForPatient(patient: IJwtPayload) {
    await this.expireStale();
    const grants = await ConsentGrant.find({ patientUser: patient.userId }).sort({ createdAt: -1 }).limit(200).lean();
    const now = Date.now();
    const isLive = (g: (typeof grants)[number]) => g.status === 'ACTIVE' && g.expiresAt.getTime() > now;
    return {
      active: grants.filter(isLive),
      history: grants.filter((g) => !isLive(g)),
    };
  }

  static async listForDoctor(doctor: IJwtPayload) {
    await this.expireStale();
    return ConsentGrant.find({
      doctorUser: doctor.userId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    })
      .select('-patientUser')
      .sort({ expiresAt: 1 })
      .lean();
  }

  /** Takes effect immediately: the access policy re-reads the grant on every request */
  static async revoke(
    patient: IJwtPayload,
    grantId: string,
    reason?: string,
    ctx: { ipAddress?: string; userAgent?: string } = {}
  ) {
    if (!Types.ObjectId.isValid(grantId)) throw new AppError('Consent grant not found', 404);
    const grant = await ConsentGrant.findOneAndUpdate(
      { _id: grantId, patientUser: patient.userId, status: 'ACTIVE' },
      { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
      { new: true }
    );
    if (!grant) throw new AppError('Active consent grant not found', 404);

    const user = await User.findById(patient.userId).select('name').lean();
    const name = user?.name ?? patient.publicId;
    await AuditService.log({
      actor: { userId: patient.userId, publicId: patient.publicId, name, role: 'PATIENT' },
      targetPatientId: patient.publicId,
      targetPatientUserId: patient.userId,
      action: 'CONSENT_REVOKED',
      details: JSON.stringify({ grantId, doctorId: grant.doctorId, reason }),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    await NotificationService.notify(grant.doctorUser, {
      type: 'CONSENT_REVOKED',
      title: 'Access revoked',
      body: `${name} revoked the additional record access you had been granted.`,
      data: { grantId },
    });
    return grant;
  }

  /** Tells doctors when a grant is about to lapse (called by the periodic sweeper) */
  static async notifyExpiringSoon(): Promise<void> {
    const grants = await ConsentGrant.find({
      status: 'ACTIVE',
      expiresAt: { $gt: new Date(), $lte: new Date(Date.now() + EXPIRING_SOON_MS) },
      expiryNotified: { $ne: true },
    });
    for (const g of grants) {
      await ConsentGrant.updateOne({ _id: g._id }, { expiryNotified: true });
      await NotificationService.notify(g.doctorUser, {
        type: 'CONSENT_EXPIRING',
        title: 'Access expiring soon',
        body: 'Additional record access granted to you ends within the hour.',
        data: { grantId: g._id.toString() },
      });
    }
  }
}
