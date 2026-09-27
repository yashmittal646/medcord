import { Response, NextFunction } from 'express';
import { EmergencyService } from '../services/emergency.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class EmergencyController {
  static async getEmergencySnapshot(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const emergencyReason = (req.query.reason as string) || (req.body?.reason as string);

      const snapshot = await EmergencyService.getEmergencySnapshot(req.user!, patientId, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        emergencyReason,
      });

      res.status(200).json({
        success: true,
        message: 'EMERGENCY MEDICAL SNAPSHOT - ACCESS AUDIT LOGGED',
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  }
}
