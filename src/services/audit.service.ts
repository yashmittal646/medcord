import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { AuditActionType, IJwtPayload, UserRole } from '../types/index.js';

export interface CreateAuditLogParams {
  actor: {
    userId: string;
    publicId: string;
    name: string;
    role: UserRole;
  };
  targetPatientId?: string;
  targetPatientUserId?: string;
  action: AuditActionType;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        actor: {
          userId: new Types.ObjectId(params.actor.userId),
          publicId: params.actor.publicId,
          name: params.actor.name,
          role: params.actor.role,
        },
        targetPatientId: params.targetPatientId,
        targetPatient: params.targetPatientUserId
          ? new Types.ObjectId(params.targetPatientUserId)
          : undefined,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      // Never crash the primary request if logging fails, but log error to console
      console.error('⚠️ Audit Logging Error:', error);
    }
  }

  static async getLogsForPatient(patientId: string, limit = 50) {
    return AuditLog.find({ targetPatientId: patientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
