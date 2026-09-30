import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const data = await NotificationService.list(req.user!.userId, Number.isFinite(limit) ? limit : 50);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markRead(req.user!.userId, String(req.params.id));
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAllRead(req.user!.userId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static stream(req: AuthenticatedRequest, res: Response): void {
    NotificationService.subscribe(req.user!.userId, res);
  }
}
