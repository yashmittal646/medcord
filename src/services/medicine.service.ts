import { Types } from 'mongoose';
import { Medicine, IMedicine, medicineDedupeKey, normalizeSearchText } from '../models/Medicine.js';
import { DoctorMedicineUsage } from '../models/DoctorMedicineUsage.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';
import { MedicineForm } from '../config/medicineForms.js';

export const SEARCH_LIMIT = 15;
const PREFIX_POOL = 60;
const MIN_QUERY = 1;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Global catalogue + this doctor's private additions */
export const visibleTo = (doctorId: string) => ({
  $or: [{ scope: 'global' }, { scope: 'doctor_private', createdByDoctor: new Types.ObjectId(doctorId) }],
});

export interface MedicineResult {
  id: string;
  brandName: string;
  genericName?: string;
  strength?: string;
  form: MedicineForm;
  manufacturer?: string;
  scope: IMedicine['scope'];
  isVerified: boolean;
  favourite?: boolean;
}

export const toResult = (m: any, favourite?: boolean): MedicineResult => ({
  id: String(m._id),
  brandName: m.brandName,
  genericName: m.genericName || undefined,
  strength: m.strength || undefined,
  form: m.form,
  manufacturer: m.manufacturer || undefined,
  scope: m.scope,
  isVerified: m.isVerified,
  ...(favourite !== undefined && { favourite }),
});

export class MedicineService {
  /**
   * Prefix matches on brand or generic name come first (served by the lowercase indexes), then a contains
   * fallback where every typed word must appear somewhere in the brand or generic name. Within each tier:
   * brand matches before generic, medicines this doctor uses often first, then shorter names.
   */
  static async search(caller: IJwtPayload, rawQuery: string, limit = SEARCH_LIMIT): Promise<MedicineResult[]> {
    const q = normalizeSearchText(rawQuery).slice(0, 80);
    if (q.length < MIN_QUERY) return [];
    const max = Math.min(Math.max(limit, 1), SEARCH_LIMIT);
    const vis = visibleTo(caller.userId);
    const prefix = new RegExp(`^${escapeRegex(q)}`);

    const prefixHits = await Medicine.find({ $and: [vis, { $or: [{ brandNameLower: prefix }, { genericNameLower: prefix }] }] })
      .limit(PREFIX_POOL)
      .lean();

    let containsHits: any[] = [];
    if (prefixHits.length < max) {
      const words = q.split(' ').filter(Boolean).slice(0, 5);
      const seen = prefixHits.map((m) => m._id);
      containsHits = await Medicine.find({
        $and: [
          vis,
          { _id: { $nin: seen } },
          ...words.map((w) => {
            const re = new RegExp(escapeRegex(w));
            return { $or: [{ brandNameLower: re }, { genericNameLower: re }] };
          }),
        ],
      })
        .limit(PREFIX_POOL)
        .maxTimeMS(2000)
        .lean();
    }

    const usage = new Map(
      (
        await DoctorMedicineUsage.find({
          doctor: caller.userId,
          medicine: { $in: [...prefixHits, ...containsHits].map((m) => m._id) },
        }).lean()
      ).map((u) => [String(u.medicine), u])
    );

    const rank = (m: any, tier: number) => {
      const u = usage.get(String(m._id));
      const brandPrefix = m.brandNameLower.startsWith(q) ? 0 : 1;
      return [tier, brandPrefix, u?.favourite ? 0 : 1, -(u?.useCount ?? 0), m.brandNameLower.length, m.brandNameLower] as const;
    };
    const cmp = (a: readonly (number | string)[], b: readonly (number | string)[]) => {
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
      return 0;
    };

    return [...prefixHits.map((m) => ({ m, k: rank(m, 0) })), ...containsHits.map((m) => ({ m, k: rank(m, 1) }))]
      .sort((a, b) => cmp(a.k, b.k))
      .slice(0, max)
      .map(({ m }) => toResult(m, usage.get(String(m._id))?.favourite));
  }

  /** Favourites first, then most recently used */
  static async recent(caller: IJwtPayload, limit = SEARCH_LIMIT): Promise<MedicineResult[]> {
    const rows = await DoctorMedicineUsage.find({ doctor: caller.userId })
      .sort({ favourite: -1, lastUsedAt: -1 })
      .limit(limit * 2)
      .populate('medicine')
      .lean();
    return rows
      .filter((r: any) => r.medicine && (r.medicine.scope === 'global' || String(r.medicine.createdByDoctor) === caller.userId))
      .slice(0, limit)
      .map((r: any) => toResult(r.medicine, r.favourite));
  }

  /** A medicine missing from the catalogue: private to this doctor and usable immediately */
  static async createPrivate(
    caller: IJwtPayload,
    input: { brandName: string; strength?: string; form: MedicineForm; genericName?: string; manufacturer?: string }
  ): Promise<MedicineResult> {
    const brandName = input.brandName.replace(/\s+/g, ' ').trim();
    const key = medicineDedupeKey(brandName, input.strength, input.manufacturer, caller.userId);
    const existing = await Medicine.findOne({ dedupeKey: key }).lean();
    if (existing) return toResult(existing);
    const doc = await Medicine.create({
      brandName,
      genericName: input.genericName?.trim() || undefined,
      strength: input.strength?.trim() || undefined,
      form: input.form,
      manufacturer: input.manufacturer?.trim() || undefined,
      source: 'doctor_added',
      scope: 'doctor_private',
      createdByDoctor: new Types.ObjectId(caller.userId),
      isVerified: false,
      dedupeKey: key,
    });
    return toResult(doc.toObject());
  }

  /** Resolve medicines a doctor put on a prescription; anything not visible to them is rejected */
  static async assertVisible(caller: IJwtPayload, ids: string[]) {
    const unique = [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id));
    if (unique.length !== new Set(ids).size) throw new AppError('Medicine not found', 404);
    const found = await Medicine.find({ $and: [visibleTo(caller.userId), { _id: { $in: unique } }] }).lean();
    if (found.length !== unique.length) throw new AppError('Medicine not found', 404);
    return new Map(found.map((m) => [String(m._id), m]));
  }

  static async recordUsage(doctorId: string, medicineIds: string[]) {
    if (!medicineIds.length) return;
    const now = new Date();
    await DoctorMedicineUsage.bulkWrite(
      [...new Set(medicineIds)].map((id) => ({
        updateOne: {
          filter: { doctor: new Types.ObjectId(doctorId), medicine: new Types.ObjectId(id) },
          update: { $inc: { useCount: 1 }, $set: { lastUsedAt: now }, $setOnInsert: { favourite: false } },
          upsert: true,
        },
      }))
    );
  }

  static async setFavourite(caller: IJwtPayload, medicineId: string, favourite: boolean) {
    await this.assertVisible(caller, [medicineId]);
    await DoctorMedicineUsage.updateOne(
      { doctor: new Types.ObjectId(caller.userId), medicine: new Types.ObjectId(medicineId) },
      { $set: { favourite }, $setOnInsert: { useCount: 0 } },
      { upsert: true }
    );
    return { favourite };
  }

  // ── Admin review of doctor-added medicines ─────────────────────────────

  static async listPending() {
    const rows = await Medicine.find({ scope: 'doctor_private', isVerified: false, reviewedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const doctors = new Map(
      (await User.find({ _id: { $in: rows.map((r) => r.createdByDoctor) } }).select('name publicId').lean()).map((u) => [String(u._id), u])
    );
    return rows.map((r) => {
      const d = doctors.get(String(r.createdByDoctor));
      return { ...toResult(r), createdAt: r.createdAt, doctorName: d?.name, doctorId: d?.publicId };
    });
  }

  /**
   * Make a doctor's medicine part of the global catalogue. If the catalogue already has the same product
   * (same brand, strength and manufacturer), the private copy is retired and the global entry is returned;
   * prescriptions keep their own snapshot either way.
   */
  static async promote(medicineId: string) {
    if (!Types.ObjectId.isValid(medicineId)) throw new AppError('Medicine not found', 404);
    const med = await Medicine.findById(medicineId);
    if (!med || med.scope !== 'doctor_private') throw new AppError('Medicine not found', 404);
    const globalKey = medicineDedupeKey(med.brandName, med.strength, med.manufacturer);
    const existing = await Medicine.findOne({ dedupeKey: globalKey, scope: 'global' });
    if (existing) {
      med.reviewedAt = new Date();
      await med.save();
      return { merged: true, medicine: toResult(existing.toObject()) };
    }
    med.scope = 'global';
    med.isVerified = true;
    med.reviewedAt = new Date();
    med.dedupeKey = globalKey;
    await med.save();
    return { merged: false, medicine: toResult(med.toObject()) };
  }

  /** Turned down: stays private to the doctor who added it, and leaves the review queue */
  static async reject(medicineId: string) {
    if (!Types.ObjectId.isValid(medicineId)) throw new AppError('Medicine not found', 404);
    const res = await Medicine.updateOne({ _id: medicineId, scope: 'doctor_private' }, { $set: { reviewedAt: new Date() } });
    if (!res.matchedCount) throw new AppError('Medicine not found', 404);
    return { rejected: true };
  }
}
