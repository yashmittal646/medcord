import fs from 'fs';
import { Types } from 'mongoose';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { User } from '../models/User.js';
import { StorageService } from './storage.service.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload, RecordType } from '../types/index.js';
import { CreateMedicalRecordInput, UpdateMedicalRecordInput } from '../validators/record.validator.js';

export interface RecordFilterOptions {
  recordType?: RecordType;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class RecordService {
  static async createRecord(
    user: IJwtPayload,
    data: CreateMedicalRecordInput,
    file?: Express.Multer.File
  ) {
    let targetPatientId = user.publicId;
    let targetPatientUserId = user.userId;

    // If doctor is uploading for a patient
    if (user.role === 'DOCTOR') {
      if (!data.patientId) {
        throw new AppError('Patient ID is required when a doctor uploads a medical record', 400);
      }
      const hasAccess = await AccessGrantService.hasApprovedAccess(user.publicId, data.patientId);
      if (!hasAccess) {
        throw new AppError('Access Denied: Patient consent is required before uploading records for this patient.', 403);
      }
      const patientUser = await User.findOne({ publicId: data.patientId, role: 'PATIENT' });
      if (!patientUser) {
        throw new AppError(`Patient with ID '${data.patientId}' not found`, 404);
      }
      targetPatientId = patientUser.publicId;
      targetPatientUserId = patientUser._id.toString();
    }

    // Process file attachment if provided
    let fileAttachment;
    if (file) {
      fileAttachment = await StorageService.uploadFile(file);
    }

    // Parse tags if string
    let parsedTags: string[] = [];
    if (typeof data.tags === 'string') {
      try {
        parsedTags = JSON.parse(data.tags);
      } catch {
        parsedTags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const record = await MedicalRecord.create({
      patient: new Types.ObjectId(targetPatientUserId),
      patientId: targetPatientId,
      uploadedBy: new Types.ObjectId(user.userId),
      uploaderRole: user.role,
      recordType: data.recordType,
      title: data.title,
      recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
      doctorName: data.doctorName,
      facilityName: data.facilityName,
      description: data.description,
      diagnosis: data.diagnosis,
      file: fileAttachment,
      tags: parsedTags,
    });

    return record;
  }

  static async getRecordsForPatient(
    requestingUser: IJwtPayload,
    patientId: string,
    filters: RecordFilterOptions = {}
  ) {
    // Authorization check: Patient can only view their own; Doctor can view requested patientId
    if (requestingUser.role === 'PATIENT' && requestingUser.publicId !== patientId) {
      throw new AppError('Forbidden: You can only view your own medical records', 403);
    }

    if (requestingUser.role === 'DOCTOR') {
      const hasAccess = await AccessGrantService.hasApprovedAccess(requestingUser.publicId, patientId);
      if (!hasAccess) {
        throw new AppError('Access Denied: Patient consent is required to view medical records.', 403);
      }
    }

    const query: any = { patientId };

    if (filters.recordType) {
      query.recordType = filters.recordType;
    }

    if (filters.from || filters.to) {
      query.recordDate = {};
      if (filters.from) query.recordDate.$gte = new Date(filters.from);
      if (filters.to) query.recordDate.$lte = new Date(filters.to);
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { diagnosis: searchRegex },
        { doctorName: searchRegex },
        { facilityName: searchRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .sort({ recordDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name publicId role'),
      MedicalRecord.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getRecordById(requestingUser: IJwtPayload, recordId: string) {
    const record = await MedicalRecord.findById(recordId).populate(
      'uploadedBy',
      'name publicId role'
    );
    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    // Security check
    if (requestingUser.role === 'PATIENT' && record.patientId !== requestingUser.publicId) {
      throw new AppError('Forbidden: You do not have access to this record', 403);
    }

    return record;
  }

  static async getDownloadableFile(requestingUser: IJwtPayload, recordId: string) {
    const record = await this.getRecordById(requestingUser, recordId);

    if (!record.file) {
      throw new AppError('This medical record has no attached document', 404);
    }

    if (record.file.storageType === 'cloudinary' && record.file.url) {
      return {
        type: 'url',
        url: record.file.url,
        filename: record.file.originalName,
        mimeType: record.file.mimeType,
      };
    }

    // Local file storage
    const filePath = StorageService.getLocalFilePath(record.file.filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError('Attached document file is missing on the server', 404);
    }

    return {
      type: 'stream',
      filePath,
      filename: record.file.originalName,
      mimeType: record.file.mimeType,
      size: record.file.sizeBytes,
    };
  }

  static async deleteRecord(requestingUser: IJwtPayload, recordId: string) {
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    if (requestingUser.role === 'PATIENT' && record.patientId !== requestingUser.publicId) {
      throw new AppError('Forbidden: You can only delete your own medical records', 403);
    }

    // If local file, delete from disk
    if (record.file && record.file.storageType === 'local') {
      const filePath = StorageService.getLocalFilePath(record.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to remove local file:', e);
        }
      }
    }

    await MedicalRecord.findByIdAndDelete(recordId);
    return { message: 'Medical record deleted successfully' };
  }
}
