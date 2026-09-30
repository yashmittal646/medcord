import fs from 'fs';
import { Types } from 'mongoose';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { User } from '../models/User.js';
import { StorageService } from './storage.service.js';
import { AccessGrantService } from './accessGrant.service.js';
import { AppError } from '../utils/appError.js';
import { AccessPolicy, AuditContext, RECORD_DENIED_MESSAGE } from './accessPolicy.service.js';
import { ClassificationService } from './classification.service.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import {
  RECORD_TYPE_TO_CATEGORY,
  deriveClassification,
  normalizeSpecialization,
  splitConditions,
  Specialization,
} from '../config/taxonomy.js';
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

/** Accepts a JSON array or a comma-separated string */
function parseList(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* fall through to comma-separated */
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
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
      const cleanPatientId = data.patientId.trim().toUpperCase();
      const hasAccess = await AccessGrantService.hasApprovedAccess(user.publicId, cleanPatientId);
      if (!hasAccess) {
        throw new AppError('Access Denied: Patient consent is required before uploading records for this patient.', 403);
      }
      const patientUser = await User.findOne({ publicId: cleanPatientId, role: 'PATIENT' });
      if (!patientUser) {
        throw new AppError(`Patient with ID '${cleanPatientId}' not found`, 404);
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

    // ── Classification ────────────────────────────────────────────────
    const category = data.category ?? RECORD_TYPE_TO_CATEGORY[data.recordType] ?? 'OTHER';
    const { known: knownConditions, unknown: freeTextConditions } = splitConditions(parseList(data.conditions));
    const explicitlyTagged = Boolean(data.category) || knownConditions.length > 0 || data.sensitive === 'true';
    const uploaderIsDoctor = user.role === 'DOCTOR';

    let extraSpecs: Specialization[] = [];
    if (uploaderIsDoctor) {
      const profile = await DoctorProfile.findOne({ user: user.userId }).lean();
      const spec = normalizeSpecialization(profile?.specialization);
      if (spec) extraSpecs = [spec];
    }

    let classification;
    if (explicitlyTagged || uploaderIsDoctor) {
      const derived = deriveClassification({
        category,
        conditions: knownConditions,
        forceSensitive: data.sensitive === 'true',
        extraSpecializations: extraSpecs,
      });
      classification = {
        ...derived,
        source: 'UPLOADER_FORM' as const,
        patientReviewed: !uploaderIsDoctor,
      };
    } else {
      // Untagged patient upload: visible to the patient only until it is classified or reviewed
      classification = {
        category,
        associatedConditions: [],
        targetSpecializations: [],
        sensitivityLevel: 'STANDARD' as const,
        source: 'UNCLASSIFIED' as const,
        patientReviewed: false,
      };
    }
    parsedTags = [...new Set([...parsedTags, ...freeTextConditions])];

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
      classification,
    });

    // Untagged patient uploads are classified in the background; until then only the patient can open them
    if (classification.source === 'UNCLASSIFIED') {
      void ClassificationService.classifyRecord(record._id.toString()).catch((e) =>
        console.error('⚠️ Classification failed:', e)
      );
    }

    return toClientRecord(record);
  }

  static async getRecordsForPatient(
    requestingUser: IJwtPayload,
    patientId: string,
    filters: RecordFilterOptions = {}
  ) {
    patientId = (patientId || '').trim().toUpperCase();
    // Patients: own records. Doctors: connection + verified + only records their specialization/consent covers.
    const visible = await AccessPolicy.visibleRecordsFilter(requestingUser, patientId);
    const clauses: Record<string, unknown>[] = [visible];

    if (filters.recordType) {
      clauses.push({ recordType: filters.recordType });
    }

    if (filters.from || filters.to) {
      const range: Record<string, Date> = {};
      if (filters.from) range.$gte = new Date(filters.from);
      if (filters.to) range.$lte = new Date(filters.to);
      clauses.push({ recordDate: range });
    }

    if (filters.search) {
      const searchRegex = new RegExp(String(filters.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      clauses.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { diagnosis: searchRegex },
          { doctorName: searchRegex },
          { facilityName: searchRegex },
        ],
      });
    }

    const query = { $and: clauses };
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
      records: records.map(toClientRecord),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Loads a record and runs it through the access policy; throws 404/403 and audits denials */
  private static async loadAuthorized(
    user: IJwtPayload,
    recordId: string,
    action: 'READ' | 'DOWNLOAD',
    ctx: AuditContext,
    populate = true
  ) {
    const query = MedicalRecord.findById(recordId);
    const record = await (populate ? query.populate('uploadedBy', 'name publicId role') : query);
    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    const decision = await AccessPolicy.evaluate(user, record, action);
    await AccessPolicy.audit(user, record, action === 'READ' ? 'RECORD_VIEW' : 'RECORD_DOWNLOAD', decision, ctx);
    if (!decision.allow) {
      throw new AppError(RECORD_DENIED_MESSAGE, 403);
    }
    return record;
  }

  static async getRecordById(requestingUser: IJwtPayload, recordId: string, ctx: AuditContext = {}) {
    const record = await this.loadAuthorized(requestingUser, recordId, 'READ', ctx);
    return toClientRecord(record);
  }

  /** Authorizes and describes where the bytes live. The storage location itself is never sent to the client. */
  static async getDownloadableFile(requestingUser: IJwtPayload, recordId: string, ctx: AuditContext = {}) {
    const record = await this.loadAuthorized(requestingUser, recordId, 'DOWNLOAD', ctx, false);

    if (!record.file) {
      throw new AppError('This medical record has no attached document', 404);
    }
    const meta = { filename: record.file.originalName, mimeType: record.file.mimeType, size: record.file.sizeBytes };

    if (record.file.storageType === 'cloudinary') {
      return { type: 'remote' as const, url: StorageService.getCloudinaryDeliveryUrl(record.file), ...meta };
    }

    const filePath = StorageService.getLocalFilePath(record.file.filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError('Attached document file is missing on the server', 404);
    }
    return { type: 'stream' as const, filePath, ...meta };
  }

  static async deleteRecord(requestingUser: IJwtPayload, recordId: string, ctx: AuditContext = {}) {
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    const decision = await AccessPolicy.canDelete(requestingUser, record);
    if (!decision.allow) {
      await AccessPolicy.audit(requestingUser, record, 'RECORD_DELETE', decision, ctx);
      throw new AppError('Forbidden: You are not permitted to delete this medical record', 403);
    }

    if (record.file) {
      await StorageService.deleteFile(record.file);
    }

    await MedicalRecord.findByIdAndDelete(recordId);
    await AccessPolicy.audit(
      requestingUser,
      record,
      'RECORD_DELETE',
      { ...decision, allow: true },
      ctx
    );
    return { message: 'Medical record deleted successfully' };
  }
}

/** Plain object safe to send to a client: no storage keys or direct file URLs */
export function toClientRecord(doc: any) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj.file) {
    delete obj.file.url;
    delete obj.file.publicCloudId;
    delete obj.file.filename;
    delete obj.file.deliveryType;
  }
  return obj;
}
