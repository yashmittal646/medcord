import { Response, NextFunction } from 'express';
import { AccessGrantService } from '../services/accessGrant.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AccessGrantController {
  /**
   * Doctor requests access to patient
   * POST /api/access-grants/request
   */
  static async requestAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = req.user!;
      const { patientId, reason } = req.body;
      const grant = await AccessGrantService.requestAccess(doctor, patientId, reason);
      res.status(201).json({
        success: true,
        message: 'Access request submitted successfully to patient',
        data: grant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor checks status of access for a patient
   * GET /api/access-grants/status/:patientId
   */
  static async getAccessStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = req.user!;
      const { patientId } = req.params;
      const status = await AccessGrantService.getAccessStatus(doctor, patientId as string);
      res.status(200).json({
        success: true,
        message: 'Access status retrieved',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient gets all their incoming access requests & active permissions
   * GET /api/access-grants/my-grants
   */
  static async getPatientGrants(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.user!;
      const data = await AccessGrantService.getPatientGrants(patient);
      res.status(200).json({
        success: true,
        message: 'Access grants and requests retrieved',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient responds to access request (APPROVE, REJECT, REVOKE)
   * POST /api/access-grants/:id/respond
   */
  static async respondToGrant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.user!;
      const { id } = req.params;
      const { decision } = req.body;
      const grant = await AccessGrantService.respondToGrant(patient, id as string, decision);
      res.status(200).json({
        success: true,
        message: `Access request has been ${decision.toLowerCase()}d successfully`,
        data: grant,
      });
    } catch (error) {
      next(error);
    }
  }
}
