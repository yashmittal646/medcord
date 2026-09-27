import { Response, NextFunction } from 'express';
import { HealthPathService } from '../services/healthPath.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class HealthPathController {
  static async createHealthPath(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const healthPath = await HealthPathService.createHealthPath(req.user!, req.body);
      res.status(201).json({
        success: true,
        message: 'Health Path created successfully and medications synced to patient profile',
        data: healthPath,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHealthPaths(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req.query.patientId as string) || req.user!.publicId;
      const status = req.query.status as any;
      const paths = await HealthPathService.getHealthPathsForPatient(req.user!, patientId, status);
      res.status(200).json({ success: true, data: paths });
    } catch (error) {
      next(error);
    }
  }

  static async getHealthPathById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pathId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const path = await HealthPathService.getHealthPathById(req.user!, pathId);
      res.status(200).json({ success: true, data: path });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pathId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updatedPath = await HealthPathService.updateStatus(
        req.user!,
        pathId,
        req.body.status
      );
      res.status(200).json({
        success: true,
        message: `Health Path status updated to ${req.body.status}`,
        data: updatedPath,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProgressNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pathId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updatedPath = await HealthPathService.addProgressNote(
        req.user!,
        pathId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Progress note added successfully',
        data: updatedPath,
      });
    } catch (error) {
      next(error);
    }
  }
}
