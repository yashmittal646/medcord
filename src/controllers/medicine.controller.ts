import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { MedicineService } from '../services/medicine.service.js';
import { LabTestService } from '../services/labTest.service.js';

const resolveId = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export class MedicineController {
  static async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MedicineService.search(req.user!, String(req.query.q ?? ''), Number(req.query.limit) || undefined);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async recent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await MedicineService.recent(req.user!) });
    } catch (err) { next(err); }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MedicineService.createPrivate(req.user!, req.body);
      res.status(201).json({ success: true, message: 'Medicine added', data });
    } catch (err) { next(err); }
  }

  static async favourite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MedicineService.setFavourite(req.user!, resolveId(req.params.id), req.body.favourite);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async labTests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await LabTestService.search(req.user!, String(req.query.q ?? '')) });
    } catch (err) { next(err); }
  }

  // Admin
  static async pending(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await MedicineService.listPending() });
    } catch (err) { next(err); }
  }

  static async promote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MedicineService.promote(resolveId(req.params.id));
      res.status(200).json({ success: true, message: 'Medicine added to the catalogue', data });
    } catch (err) { next(err); }
  }

  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MedicineService.reject(resolveId(req.params.id));
      res.status(200).json({ success: true, message: 'Medicine kept private', data });
    } catch (err) { next(err); }
  }
}
