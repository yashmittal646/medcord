import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { HealthTrackerService } from '../services/healthTracker.service.js';

const resolveId = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export class HealthTrackerController {
  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await HealthTrackerService.getTracker(req.user!) });
    } catch (err) { next(err); }
  }

  static async catalog(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: HealthTrackerService.catalog() });
    } catch (err) { next(err); }
  }

  static async reports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await HealthTrackerService.listReports(req.user!) });
    } catch (err) { next(err); }
  }

  static async extract(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await HealthTrackerService.extract(req.user!, { recordId: req.body?.recordId });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async addReading(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await HealthTrackerService.addReading(req.user!, req.body);
      res.status(201).json({ success: true, message: 'Reading added', data });
    } catch (err) { next(err); }
  }

  static async deleteReading(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await HealthTrackerService.deleteReading(req.user!, resolveId(req.params.id));
      res.status(200).json({ success: true, message: 'Reading removed' });
    } catch (err) { next(err); }
  }

  static async insights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await HealthTrackerService.insights(req.user!, req.body.langCode, Boolean(req.body.refresh));
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}
