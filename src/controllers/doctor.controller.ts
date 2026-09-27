import { Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class DoctorController {
  static async lookupPatient(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const result = await DoctorService.lookupPatient(req.user!, patientId, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        reason: req.query.reason as string,
      });

      res.status(200).json({
        success: true,
        message: `Patient records retrieved for ${patientId}. Access logged.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPatientTimeline(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const filters = {
        recordType: req.query.recordType as any,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
        from: req.query.from as string,
        to: req.query.to as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await DoctorService.getPatientTimeline(req.user!, patientId, filters);
      res.status(200).json({
        success: true,
        data: result.events,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPatientRecords(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const filters = {
        recordType: req.query.recordType as any,
        from: req.query.from as string,
        to: req.query.to as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await DoctorService.getPatientRecords(req.user!, patientId, filters);
      res.status(200).json({
        success: true,
        data: result.records,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordConsultation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const record = await DoctorService.createConsultation(
        req.user!,
        patientId,
        {
          title: req.body.title,
          diagnosis: req.body.diagnosis,
          description: req.body.description,
          facilityName: req.body.facilityName,
          recordDate: req.body.recordDate,
          file: req.file,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Consultation record created successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}
