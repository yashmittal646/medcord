import { MedicalRecord } from '../models/MedicalRecord.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { User } from '../models/User.js';
import { AccessPolicy } from './accessPolicy.service.js';
import { toClientRecord } from './record.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload, RecordType } from '../types/index.js';

export interface TimelineQueryFilters {
  recordType?: RecordType;
  year?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export class TimelineService {
  static async getPatientTimeline(
    requestingUser: IJwtPayload,
    patientId: string,
    filters: TimelineQueryFilters = {}
  ) {
    patientId = (patientId || '').trim().toUpperCase();
    // Only records the requester may see (patients: all their own; doctors: specialization/consent scoped)
    const visible = await AccessPolicy.visibleRecordsFilter(requestingUser, patientId);
    const query: any = { $and: [visible] };

    if (filters.recordType) {
      query.$and.push({ recordType: filters.recordType });
    }

    if (filters.year) {
      const startOfYear = new Date(`${filters.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${filters.year}-12-31T23:59:59.999Z`);
      query.$and.push({ recordDate: { $gte: startOfYear, $lte: endOfYear } });
    } else if (filters.from || filters.to) {
      const range: Record<string, Date> = {};
      if (filters.from) range.$gte = new Date(filters.from);
      if (filters.to) range.$lte = new Date(filters.to);
      query.$and.push({ recordDate: range });
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .sort({ recordDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name publicId role'),
      MedicalRecord.countDocuments(query),
    ]);

    // Format events for timeline presentation
    const events = records.map((rec) => ({
      id: rec._id,
      recordType: rec.recordType,
      title: rec.title,
      recordDate: rec.recordDate,
      doctorName: rec.doctorName || (rec.uploaderRole === 'DOCTOR' ? (rec.uploadedBy as any)?.name : undefined),
      facilityName: rec.facilityName,
      description: rec.description,
      diagnosis: rec.diagnosis,
      hasAttachment: Boolean(rec.file),
      fileDetails: rec.file
        ? {
            originalName: rec.file.originalName,
            mimeType: rec.file.mimeType,
            sizeBytes: rec.file.sizeBytes,
          }
        : null,
      tags: rec.tags || [],
      uploadedBy: {
        name: (rec.uploadedBy as any)?.name || 'Unknown',
        role: rec.uploaderRole,
        publicId: (rec.uploadedBy as any)?.publicId,
      },
      createdAt: rec.createdAt,
    }));

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPatientSummary(requestingUser: IJwtPayload, targetPatientId?: string) {
    const patientId = (targetPatientId || requestingUser.publicId).trim().toUpperCase();
    // Counts and recent records only cover what the requester is allowed to see
    const visible = await AccessPolicy.visibleRecordsFilter(requestingUser, patientId);

    const patientUser = await User.findOne({ publicId: patientId, role: 'PATIENT' });
    if (!patientUser) {
      throw new AppError(`Patient with ID '${patientId}' not found`, 404);
    }

    const profile = await PatientProfile.findOne({ user: patientUser._id });
    if (!profile) {
      throw new AppError('Patient medical profile not found', 404);
    }

    // Fetch recent 5 medical records
    const recentRecords = await MedicalRecord.find(visible)
      .sort({ recordDate: -1 })
      .limit(5)
      .populate('uploadedBy', 'name publicId role');

    // Aggregate counts by record type
    const recordCounts = await MedicalRecord.aggregate([
      { $match: visible },
      { $group: { _id: '$recordType', count: { $sum: 1 } } },
    ]);

    const countsMap: Record<string, number> = {
      PRESCRIPTION: 0,
      LAB_REPORT: 0,
      CONSULTATION: 0,
      CHECKUP: 0,
      OTHER: 0,
    };

    recordCounts.forEach((item) => {
      countsMap[item._id] = item.count;
    });

    return {
      patient: {
        name: patientUser.name,
        email: patientUser.email,
        phone: patientUser.phone,
        patientId: patientUser.publicId,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        emergencyContact: profile.emergencyContact,
      },
      criticalInformation: {
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
        currentMedications: profile.currentMedications.filter((m) => m.status === 'ACTIVE'),
      },
      statistics: {
        totalRecords: Object.values(countsMap).reduce((a, b) => a + b, 0),
        countsByType: countsMap,
      },
      recentRecords: recentRecords.map(toClientRecord),
    };
  }
}
