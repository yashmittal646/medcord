import { Types } from 'mongoose';
import { PrescriptionTemplate, ILetterhead } from '../models/PrescriptionTemplate.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';

/** Error code the client uses to send the doctor to the letterhead setup page */
export const LETTERHEAD_REQUIRED = 'Set up and lock your prescription letterhead before writing prescriptions.';

const pickLetterhead = (t: any): ILetterhead => ({
  header: {
    doctorName: t.header?.doctorName ?? '',
    qualification: t.header?.qualification || undefined,
    specialization: t.header?.specialization || undefined,
    registrationNumber: t.header?.registrationNumber || undefined,
  },
  footer: {
    clinicName: t.footer?.clinicName || undefined,
    clinicAddress: t.footer?.clinicAddress ?? '',
    phone: t.footer?.phone ?? '',
  },
});

export class PrescriptionTemplateService {
  /** The doctor's letterhead, or a suggestion filled from their profile when none exists yet */
  static async get(caller: IJwtPayload) {
    const existing = await PrescriptionTemplate.findOne({ doctor: caller.userId }).lean();
    if (existing) return { ...pickLetterhead(existing), isLocked: existing.isLocked, lockedAt: existing.lockedAt, exists: true };

    const [user, profile] = await Promise.all([
      User.findById(caller.userId).select('name phone').lean(),
      DoctorProfile.findOne({ user: caller.userId }).lean(),
    ]);
    const name = user?.name ?? '';
    return {
      header: {
        doctorName: name ? (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`) : '',
        qualification: undefined,
        specialization: (profile as any)?.specialization || undefined,
        registrationNumber: (profile as any)?.licenseNumber || undefined,
      },
      footer: {
        clinicName: (profile as any)?.hospitalAffiliation || undefined,
        clinicAddress: '',
        phone: user?.phone ?? '',
      },
      isLocked: false,
      exists: false,
    };
  }

  /** Save edits. A locked letterhead must be unlocked (with confirmation) first. */
  static async save(caller: IJwtPayload, input: ILetterhead) {
    const existing = await PrescriptionTemplate.findOne({ doctor: caller.userId });
    if (existing?.isLocked) throw new AppError('Your letterhead is locked. Unlock it from Settings to make changes.', 409);
    const doc = await PrescriptionTemplate.findOneAndUpdate(
      { doctor: new Types.ObjectId(caller.userId) },
      { $set: { header: input.header, footer: input.footer, isLocked: false } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return { ...pickLetterhead(doc), isLocked: false, exists: true };
  }

  /** Save (when values are given) and lock in one step: from now on it is applied to every prescription */
  static async lock(caller: IJwtPayload, input?: ILetterhead) {
    if (input) await this.save(caller, input);
    const doc = await PrescriptionTemplate.findOne({ doctor: caller.userId });
    if (!doc) throw new AppError('Fill in your letterhead before locking it.', 400);
    if (doc.isLocked) return { ...pickLetterhead(doc.toObject()), isLocked: true, lockedAt: doc.lockedAt, exists: true };
    if (!doc.header?.doctorName || !doc.footer?.clinicAddress || !doc.footer?.phone) {
      throw new AppError('Doctor name, clinic address and contact number are required before locking.', 400);
    }
    doc.isLocked = true;
    doc.lockedAt = new Date();
    await doc.save();
    return { ...pickLetterhead(doc.toObject()), isLocked: true, lockedAt: doc.lockedAt, exists: true };
  }

  /** Re-open for editing. Already-issued prescriptions keep the letterhead they were issued with. */
  static async unlock(caller: IJwtPayload) {
    const doc = await PrescriptionTemplate.findOneAndUpdate(
      { doctor: caller.userId },
      { $set: { isLocked: false }, $unset: { lockedAt: 1 } },
      { new: true }
    ).lean();
    if (!doc) throw new AppError('Letterhead not found', 404);
    return { ...pickLetterhead(doc), isLocked: false, exists: true };
  }

  /** Every prescription write goes through this: no locked letterhead, no prescription */
  static async requireLocked(doctorUserId: string): Promise<ILetterhead> {
    const doc = await PrescriptionTemplate.findOne({ doctor: doctorUserId, isLocked: true }).lean();
    if (!doc) throw new AppError(LETTERHEAD_REQUIRED, 412);
    return pickLetterhead(doc);
  }
}
