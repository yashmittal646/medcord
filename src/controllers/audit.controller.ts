import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';

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
          default:
            message = log.details || `${log.action} performed by ${log.actor.name}`;
            badge = 'GENERAL';
        }

        return {
          id: log._id,
          action: log.action,
          badge,
          message,
          details: log.details,
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
      if (req.query.action) query.action = req.query.action;
      if (req.query.patientId) query.targetPatientId = req.query.patientId;

      const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100).lean();
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
