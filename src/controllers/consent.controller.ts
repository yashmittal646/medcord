import { Response, NextFunction } from 'express';
import { AccessRequestService } from '../services/accessRequest.service.js';
import { ConsentService } from '../services/consent.service.js';
import { AuthenticatedRequest } from '../types/index.js';

const ctx = (req: AuthenticatedRequest) => ({ ipAddress: req.ip, userAgent: req.headers['user-agent'] });
const idParam = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export class ConsentController {
  // POST /api/access-requests/create
  static async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AccessRequestService.create(req.user!, req.body, ctx(req));
      res.status(201).json({ success: true, message: 'Access request sent to the patient', data });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/access-requests?status=PENDING
  static async listRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data = await AccessRequestService.list(req.user!, status);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/access-requests/:id/respond
  static async respond(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AccessRequestService.respond(req.user!, idParam(req.params.id), req.body, ctx(req));
      res.status(200).json({
        success: true,
        message: req.body.decision === 'APPROVE' ? 'Access approved' : 'Access request declined',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/access-requests/:id
  static async cancelRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AccessRequestService.cancel(req.user!, idParam(req.params.id));
      res.status(200).json({ success: true, message: 'Access request cancelled', data });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/consent
  static async listConsents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ConsentService.listForPatient(req.user!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/consent/mine
  static async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ConsentService.listForDoctor(req.user!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/consent/:grantId/revoke
  static async revoke(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ConsentService.revoke(req.user!, idParam(req.params.grantId), req.body?.reason, ctx(req));
      res.status(200).json({ success: true, message: 'Consent revoked. Access has ended immediately.', data });
    } catch (error) {
      next(error);
    }
  }
}
