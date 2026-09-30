import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';

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
        let message = '';
        let badge = 'INFO';

        switch (log.action) {
          case 'DOCTOR_LOOKUP':
            message = `Doctor ${log.actor.name} (${log.actor.publicId}) viewed your medical chart`;
            badge = 'DOCTOR_VIEW';
            break;
          case 'EMERGENCY_ACCESS':
            message = `EMERGENCY ACCESS: Doctor ${log.actor.name} (${log.actor.publicId}) accessed your critical emergency dataset`;
            badge = 'EMERGENCY';
            break;
          case 'HEALTH_PATH_CREATED':
            message = `Doctor ${log.actor.name} initiated a new active Health Path treatment`;
            badge = 'HEALTH_PATH';
            break;
          case 'HEALTH_PATH_COMPLETED':
            message = `Health Path treatment was marked completed`;
            badge = 'HEALTH_PATH';
            break;
          case 'HEALTH_PATH_ARCHIVED':
            message = `Health Path was archived`;
            badge = 'HEALTH_PATH';
            break;
          case 'RECORD_UPLOAD':
            message = `New medical record uploaded`;
            badge = 'RECORD';
            break;
          case 'RECORD_VIEW':
            message = `Doctor ${log.actor.name} (${log.actor.publicId}) opened one of your records`;
            badge = 'DOCTOR_VIEW';
            break;
          case 'RECORD_DOWNLOAD':
            message = `Doctor ${log.actor.name} (${log.actor.publicId}) downloaded a document from your records`;
            badge = 'DOCTOR_VIEW';
            break;
          case 'RECORD_ACCESS_DENIED':
            message = `${log.actor.name} (${log.actor.publicId}) tried to open a record they are not permitted to see. Access was blocked.`;
            badge = 'BLOCKED';
            break;
          case 'RECORD_DELETE':
            message = `${log.actor.role === 'PATIENT' ? 'You' : log.actor.name} deleted a medical record`;
            badge = 'RECORD';
            break;
          case 'CONNECTION_REQUESTED':
            message = `Doctor ${log.actor.name} (${log.actor.publicId}) asked to connect to your chart`;
            badge = 'ACCESS_REQUEST';
            break;
          case 'CONNECTION_APPROVED':
          case 'CONNECTION_REJECTED':
          case 'CONNECTION_REVOKED':
            message = `You ${log.action.replace('CONNECTION_', '').toLowerCase()} a doctor's connection to your chart`;
            badge = 'CONSENT';
            break;
          case 'ACCESS_REQUEST_CREATED':
            message = `Doctor ${log.actor.name} (${log.actor.publicId}) requested access to additional records`;
            badge = 'ACCESS_REQUEST';
            break;
          case 'ACCESS_REQUEST_CANCELLED':
            message = `Doctor ${log.actor.name} withdrew an access request`;
            badge = 'ACCESS_REQUEST';
            break;
          case 'ACCESS_REQUEST_REJECTED':
            message = 'You declined an access request';
            badge = 'CONSENT';
            break;
          case 'CONSENT_GRANTED':
            message = 'You approved access to additional records';
            badge = 'CONSENT';
            break;
          case 'CONSENT_REVOKED':
            message = "You revoked a doctor's access to additional records";
            badge = 'CONSENT';
            break;
          case 'CONSENT_EXPIRED':
            message = 'A time-limited access grant expired';
            badge = 'CONSENT';
            break;
          default:
            message = log.details && !log.details.startsWith('{') ? log.details : `${log.action} performed by ${log.actor.name}`;
            badge = 'GENERAL';
        }

        return {
          id: log._id,
          action: log.action,
          badge,
          message,
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

      res.status(200).json({ success: true, data: logs });
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
