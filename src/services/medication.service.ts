import { Types } from 'mongoose';
import { Medication, IMedication } from '../models/Medication.js';
import { DoseLog } from '../models/DoseLog.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';
import {
  CreateMedicationInput,
  UpdateMedicationInput,
  LogDoseInput,
} from '../validators/medication.validator.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve patientId from the JWT and verify the caller is a PATIENT.
 *  DOCTORS may only read – never write – via a separate guard in the route. */
async function resolvePatientId(userId: string): Promise<string> {
  const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) })
    .select('patientId')
    .lean();
  if (!profile) throw new AppError('Patient profile not found', 404);
  return profile.patientId;
}

/** Build the deduplication fingerprint. */
function buildDeduplicationKey(
  patientId: string,
  name: string,
  dosage: string,
  startDate: Date
): string {
  const day = startDate.toISOString().split('T')[0];
  return `${patientId}::${name.toLowerCase().trim()}::${dosage.toLowerCase().trim()}::${day}`;
}

/** Assert that the medication belongs to the authenticated patient (IDOR guard). */
async function ownerOrThrow(medicationId: string, patientId: string): Promise<IMedication> {
  if (!Types.ObjectId.isValid(medicationId)) throw new AppError('Invalid medication ID', 400);
  const med = await Medication.findById(medicationId);
  if (!med) throw new AppError('Medication not found', 404);
  if (med.patientId !== patientId) throw new AppError('Access denied', 403);
  return med;
}

// ── Public service methods ────────────────────────────────────────────────────

export class MedicationService {

  // ── CRUD ──────────────────────────────────────────────────────────────────

  static async create(caller: IJwtPayload, data: CreateMedicationInput) {
    const patientId = await resolvePatientId(caller.userId);
    const startDate = data.startDate ? new Date(data.startDate) : new Date();

    const deduplicationKey = buildDeduplicationKey(patientId, data.name, data.dosage, startDate);

    // Deduplication: if an identical medication already exists (same name + dosage + start date),
    // return the existing one instead of creating a duplicate.
    const existing = await Medication.findOne({ deduplicationKey });
    if (existing) return { medication: existing, created: false };

    const med = await Medication.create({
      patient: new Types.ObjectId(caller.userId),
      patientId,
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      unit: data.unit,
      frequency: data.frequency,
      timesPerDay: data.timesPerDay,
      scheduleTimes: data.scheduleTimes,
      route: data.route,
      timing: data.timing,
      startDate,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      purpose: data.purpose,
      prescribingDoctor: data.prescribingDoctor,
      instructions: data.instructions,
      status: data.status ?? 'ACTIVE',
      sourceRecordId: data.sourceRecordId ? new Types.ObjectId(data.sourceRecordId) : undefined,
      deduplicationKey,
    });

    return { medication: med, created: true };
  }

  static async list(
    caller: IJwtPayload,
    filters: { status?: string; page?: number; limit?: number }
  ) {
    const patientId = await resolvePatientId(caller.userId);
    const query: Record<string, unknown> = { patientId };
    if (filters.status) query.status = filters.status;

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
    const skip = (page - 1) * limit;

    const [medications, total] = await Promise.all([
      Medication.find(query).sort({ status: 1, startDate: -1 }).skip(skip).limit(limit).lean(),
      Medication.countDocuments(query),
    ]);

    return { medications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  static async getById(caller: IJwtPayload, medicationId: string) {
    const patientId = await resolvePatientId(caller.userId);
    return ownerOrThrow(medicationId, patientId);
  }

  static async update(
    caller: IJwtPayload,
    medicationId: string,
    data: UpdateMedicationInput
  ) {
    const patientId = await resolvePatientId(caller.userId);
    const med = await ownerOrThrow(medicationId, patientId);

    // Apply updates
    if (data.name !== undefined) med.name = data.name;
    if (data.genericName !== undefined) med.genericName = data.genericName;
    if (data.dosage !== undefined) med.dosage = data.dosage;
    if (data.unit !== undefined) med.unit = data.unit;
    if (data.frequency !== undefined) med.frequency = data.frequency;
    if (data.timesPerDay !== undefined) med.timesPerDay = data.timesPerDay;
    if (data.scheduleTimes !== undefined) med.scheduleTimes = data.scheduleTimes;
    if (data.route !== undefined) med.route = data.route;
    if (data.timing !== undefined) med.timing = data.timing;
    if (data.startDate !== undefined) med.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) med.endDate = new Date(data.endDate);
    if (data.purpose !== undefined) med.purpose = data.purpose;
    if (data.prescribingDoctor !== undefined) med.prescribingDoctor = data.prescribingDoctor;
    if (data.instructions !== undefined) med.instructions = data.instructions;
    if (data.status !== undefined) med.status = data.status;

    // Rebuild dedup key if name/dosage/startDate changed
    med.deduplicationKey = buildDeduplicationKey(
      patientId, med.name, med.dosage, med.startDate
    );

    await med.save();
    return med;
  }

  /** Soft-delete: marks as DISCONTINUED instead of permanently removing. */
  static async discontinue(caller: IJwtPayload, medicationId: string) {
    const patientId = await resolvePatientId(caller.userId);
    const med = await ownerOrThrow(medicationId, patientId);
    med.status = 'DISCONTINUED';
    await med.save();
    return med;
  }

  // ── Dose Tracking ─────────────────────────────────────────────────────────

  static async logDose(
    caller: IJwtPayload,
    medicationId: string,
    data: LogDoseInput
  ) {
    const patientId = await resolvePatientId(caller.userId);
    const med = await ownerOrThrow(medicationId, patientId);

    // scheduledDate is stored as UTC midnight so daily aggregations work cleanly
    const scheduledDate = new Date(data.scheduledDate + 'T00:00:00.000Z');

    // upsert: one entry per (medication, date, time) tuple
    const log = await DoseLog.findOneAndUpdate(
      { medication: med._id, scheduledDate, scheduledTime: data.scheduledTime },
      {
        $set: {
          patient: new Types.ObjectId(caller.userId),
          patientId,
          medicationName: med.name,
          status: data.status,
          takenAt: data.status === 'TAKEN' ? new Date() : undefined,
          notes: data.notes,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return log;
  }

  static async getDoseLogs(
    caller: IJwtPayload,
    medicationId: string,
    filters: { from?: string; to?: string }
  ) {
    const patientId = await resolvePatientId(caller.userId);
    await ownerOrThrow(medicationId, patientId); // ownership check

    const query: Record<string, unknown> = {
      medication: new Types.ObjectId(medicationId),
      patientId,
    };
    if (filters.from || filters.to) {
      const dateRange: Record<string, Date> = {};
      if (filters.from) dateRange.$gte = new Date(filters.from + 'T00:00:00.000Z');
      if (filters.to) dateRange.$lte = new Date(filters.to + 'T23:59:59.999Z');
      query.scheduledDate = dateRange;
    }

    return DoseLog.find(query).sort({ scheduledDate: -1, scheduledTime: 1 }).lean();
  }

  /** Today's schedule: all ACTIVE medications with their scheduled times + today's logs. */
  static async getTodaySchedule(caller: IJwtPayload) {
    const patientId = await resolvePatientId(caller.userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    const activeMeds = await Medication.find({ patientId, status: 'ACTIVE' }).lean();

    // Fetch all logs for today across all meds
    const todayLogs = await DoseLog.find({
      patientId,
      scheduledDate: todayDate,
    }).lean();

    const logMap = new Map<string, typeof todayLogs[0]>();
    todayLogs.forEach((l) => {
      logMap.set(`${l.medication.toString()}::${l.scheduledTime}`, l);
    });

    const schedule: {
      medicationId: string;
      name: string;
      dosage: string;
      scheduledTime: string;
      log: typeof todayLogs[0] | null;
    }[] = [];

    for (const med of activeMeds) {
      const times = med.scheduleTimes?.length
        ? med.scheduleTimes
        : inferScheduleTimes(med.timesPerDay ?? 1);

      for (const t of times) {
        const key = `${med._id.toString()}::${t}`;
        schedule.push({
          medicationId: med._id.toString(),
          name: med.name,
          dosage: med.dosage,
          scheduledTime: t,
          log: logMap.get(key) ?? null,
        });
      }
    }

    // Sort by time
    schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    return { date: todayStr, schedule };
  }

  /** Adherence stats for a medication over the last N days. */
  static async getAdherence(
    caller: IJwtPayload,
    medicationId: string,
    days = 30
  ) {
    const patientId = await resolvePatientId(caller.userId);
    await ownerOrThrow(medicationId, patientId);

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);
    from.setUTCHours(0, 0, 0, 0);

    const logs = await DoseLog.find({
      medication: new Types.ObjectId(medicationId),
      patientId,
      scheduledDate: { $gte: from },
    }).lean();

    const total = logs.length;
    const taken = logs.filter((l) => l.status === 'TAKEN').length;
    const skipped = logs.filter((l) => l.status === 'SKIPPED').length;
    const missed = logs.filter((l) => l.status === 'MISSED').length;
    const snoozed = logs.filter((l) => l.status === 'SNOOZED').length;

    return {
      days,
      total,
      taken,
      skipped,
      missed,
      snoozed,
      adherencePercent: total > 0 ? Math.round((taken / total) * 100) : null,
    };
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Derive schedule times from timesPerDay when no explicit times are set. */
function inferScheduleTimes(timesPerDay: number): string[] {
  const presets: Record<number, string[]> = {
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['08:00', '12:00', '18:00', '22:00'],
  };
  return presets[timesPerDay] ?? ['08:00'];
}
