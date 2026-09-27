import { Response, NextFunction } from 'express';
import { TimelineService } from '../services/timeline.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class TimelineController {
  static async getMyTimeline(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = {
        recordType: req.query.recordType as any,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
        from: req.query.from as string,
        to: req.query.to as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await TimelineService.getPatientTimeline(
        req.user!,
        req.user!.publicId,
        filters
      );
      res.status(200).json({ success: true, data: result.events, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getMySummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await TimelineService.getPatientSummary(req.user!);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
