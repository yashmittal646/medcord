import { Readable } from 'stream';
import { AppError } from '../utils/appError.js';
import { Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service.js';
import { ClassificationService } from '../services/classification.service.js';
import { AuthenticatedRequest } from '../types/index.js';

const auditCtx = (req: AuthenticatedRequest) => ({ ipAddress: req.ip, userAgent: req.headers['user-agent'] });

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
      const record = await RecordService.getRecordById(req.user!, recordId, auditCtx(req));
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
      const file = await RecordService.getDownloadableFile(req.user!, recordId, auditCtx(req));
      const headers = {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.filename || 'medical-document')}`,
        'Cache-Control': 'no-store',
      };

      if (file.type === 'stream') {
        return res.sendFile(file.filePath, { headers, cacheControl: false });
      }

      // Remote storage: the server fetches the bytes so the storage URL never reaches the client
      const upstream = await fetch(file.url);
      if (!upstream.ok || !upstream.body) {
        throw new AppError('Could not retrieve the stored document', 502);
      }
      res.set(headers);
      Readable.fromWeb(upstream.body as any).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  static async updateClassification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await ClassificationService.updateClassification(req.user!, recordId, req.body);
      res.status(200).json({ success: true, message: 'Record tags updated', data });
    } catch (error) {
      next(error);
    }
  }

  static async confirmClassification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await ClassificationService.confirmClassification(req.user!, recordId);
      res.status(200).json({ success: true, message: 'Record tags confirmed', data });
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
      const result = await RecordService.deleteRecord(req.user!, recordId, auditCtx(req));
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
