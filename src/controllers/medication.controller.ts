import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { MedicationService } from '../services/medication.service.js';

const resolveId = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export class MedicationController {

  // ── Medication CRUD ──────────────────────────────────────────────────────

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MedicationService.create(req.user!, req.body);
      res.status(result.created ? 201 : 200).json({
        success: true,
        message: result.created ? 'Medication added' : 'Identical medication already exists – returning existing record',
        data: result.medication,
        duplicate: !result.created,
      });
    } catch (err) { next(err); }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MedicationService.list(req.user!, {
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const med = await MedicationService.getById(req.user!, resolveId(req.params.id));
      res.status(200).json({ success: true, data: med });
    } catch (err) { next(err); }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const med = await MedicationService.update(req.user!, resolveId(req.params.id), req.body);
      res.status(200).json({ success: true, message: 'Medication updated', data: med });
    } catch (err) { next(err); }
  }

  static async discontinue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const med = await MedicationService.discontinue(req.user!, resolveId(req.params.id));
      res.status(200).json({ success: true, message: 'Medication discontinued', data: med });
    } catch (err) { next(err); }
  }

  // ── Dose Tracking ────────────────────────────────────────────────────────

  static async logDose(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await MedicationService.logDose(req.user!, resolveId(req.params.id), req.body);
      res.status(200).json({ success: true, message: 'Dose logged', data: log });
    } catch (err) { next(err); }
  }

  static async getDoseLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await MedicationService.getDoseLogs(req.user!, resolveId(req.params.id), {
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });
      res.status(200).json({ success: true, data: logs });
    } catch (err) { next(err); }
  }

  static async getTodaySchedule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await MedicationService.getTodaySchedule(req.user!);
      res.status(200).json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }

  static async getAdherence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const stats = await MedicationService.getAdherence(req.user!, resolveId(req.params.id), days);
      res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
  }
}
