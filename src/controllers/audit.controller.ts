import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { describeForDoctor, describeForPatient } from '../utils/auditMessages.js';

/** Structured audit details are JSON for machines; show patients only the human reason, if any */
function publicDetails(details?: string): string | undefined {
  if (!details) return undefined;
  if (!details.startsWith('{')) return details;
  try {
    const parsed = JSON.parse(details);
    return typeof parsed.reason === 'string' && !/^[A-Z_]+$/.test(parsed.reason) ? parsed.reason : undefined;
  } catch {
    return undefined;
  }
}

export class AuditController {
  static async getMyActivity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = req.user!.publicId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const rawLogs = await AuditService.getLogsForPatient(patientId, limit);

      // Format logs into patient-friendly activity items
      const activities = rawLogs.map((log) => {
        const { key, params, message, badge } = describeForPatient(log);
        return {
          id: log._id,
          action: log.action,
          badge,
          message,
          messageKey: key,
          params,
          details: publicDetails(log.details),
          actor: {
            name: log.actor.name,
            role: log.actor.role,
            publicId: log.actor.publicId,
          },
          timestamp: log.createdAt,
        };
      });

      res.status(200).json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorActivity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctorUserId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const logs = await AuditLog.find({ 'actor.userId': doctorUserId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const data = logs.map((log) => {
        const { key, params, message, badge } = describeForDoctor(log);
        return {
          _id: log._id,
          action: log.action,
          badge,
          createdAt: log.createdAt,
          description: message,
          messageKey: key,
          params,
          reason: publicDetails(log.details),
          targetPatient: log.targetPatientId ? { publicId: log.targetPatientId } : undefined,
        };
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async queryLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query: any = {};
      if (typeof req.query.action === 'string') query.action = req.query.action;
      if (typeof req.query.patientId === 'string') query.targetPatientId = req.query.patientId;

      const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100).lean();
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
