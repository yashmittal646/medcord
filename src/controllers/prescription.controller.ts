import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { PrescriptionService } from '../services/prescription.service.js';
import { PrescriptionTemplateService } from '../services/prescriptionTemplate.service.js';

const resolveId = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);
const ctx = (req: AuthenticatedRequest) => ({ ip: req.ip, userAgent: req.get('user-agent') });

export class PrescriptionController {
  // Letterhead
  static async getTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionTemplateService.get(req.user!) });
    } catch (err) { next(err); }
  }

  static async saveTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, message: 'Letterhead saved', data: await PrescriptionTemplateService.save(req.user!, req.body) });
    } catch (err) { next(err); }
  }

  static async lockTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrescriptionTemplateService.lock(req.user!, req.body?.header ? req.body : undefined);
      res.status(200).json({ success: true, message: 'Letterhead locked', data });
    } catch (err) { next(err); }
  }

  static async unlockTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, message: 'Letterhead unlocked for editing', data: await PrescriptionTemplateService.unlock(req.user!) });
    } catch (err) { next(err); }
  }

  // Doctor
  static async patients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionService.connectedPatients(req.user!) });
    } catch (err) { next(err); }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrescriptionService.listForDoctor(req.user!, {
        patientId: req.query.patientId as string | undefined,
        status: req.query.status as string | undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ success: true, data: await PrescriptionService.createDraft(req.user!, req.body) });
    } catch (err) { next(err); }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionService.get(req.user!, resolveId(req.params.id)) });
    } catch (err) { next(err); }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionService.updateDraft(req.user!, resolveId(req.params.id), req.body) });
    } catch (err) { next(err); }
  }

  static async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, message: 'Draft deleted', data: await PrescriptionService.deleteDraft(req.user!, resolveId(req.params.id)) });
    } catch (err) { next(err); }
  }

  static async issue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrescriptionService.issue(req.user!, resolveId(req.params.id), ctx(req));
      res.status(200).json({ success: true, message: 'Prescription issued', data });
    } catch (err) { next(err); }
  }

  static async amend(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ success: true, data: await PrescriptionService.amend(req.user!, resolveId(req.params.id)) });
    } catch (err) { next(err); }
  }

  static async duplicate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ success: true, data: await PrescriptionService.duplicate(req.user!, resolveId(req.params.id), req.body?.patientId) });
    } catch (err) { next(err); }
  }

  // Patient
  static async patientList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionService.listForPatient(req.user!) });
    } catch (err) { next(err); }
  }

  static async testsToDo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await PrescriptionService.testsToDo(req.user!) });
    } catch (err) { next(err); }
  }

  static async setTestStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrescriptionService.setLabTestStatus(req.user!, resolveId(req.params.id), resolveId(req.params.testId), req.body.status);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}
