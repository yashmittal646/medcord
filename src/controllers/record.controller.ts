import { Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class RecordController {
  static async uploadRecord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const record = await RecordService.createRecord(req.user!, req.body, req.file);
      res.status(201).json({
        success: true,
        message: 'Medical record created and saved securely',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecords(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // If doctor is requesting, query params must supply patientId; if patient, defaults to own ID
      const patientId = (req.query.patientId as string) || req.user!.publicId;
      const filters = {
        recordType: req.query.recordType as any,
        from: req.query.from as string,
        to: req.query.to as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await RecordService.getRecordsForPatient(req.user!, patientId, filters);
      res.status(200).json({
        success: true,
        data: result.records,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecordById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const record = await RecordService.getRecordById(req.user!, recordId);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadRecordFile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const fileResult = await RecordService.getDownloadableFile(req.user!, recordId);

      if (fileResult.type === 'url' && fileResult.url) {
        return res.redirect(fileResult.url);
      }

      if (fileResult.type === 'stream' && fileResult.filePath) {
        res.setHeader('Content-Type', fileResult.mimeType || 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(fileResult.filename || 'medical-document')}"`
        );
        return res.sendFile(fileResult.filePath);
      }
    } catch (error) {
      next(error);
    }
  }

  static async deleteRecord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await RecordService.deleteRecord(req.user!, recordId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
