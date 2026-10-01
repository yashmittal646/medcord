import { Types } from 'mongoose';
import { Prescription, IPrescription, IRxMedicine, RxFrequency, LabTestStatus } from '../models/Prescription.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { User } from '../models/User.js';
import { AccessGrant } from '../models/AccessGrant.js';
import { LabTest } from '../models/LabTest.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Medication } from '../models/Medication.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { AccessGrantService } from './accessGrant.service.js';
import { MedicineService } from './medicine.service.js';
import { LabTestService } from './labTest.service.js';
import { PrescriptionTemplateService } from './prescriptionTemplate.service.js';
import { ClassificationService } from './classification.service.js';
import { NotificationService } from './notification.service.js';
import { AuditService } from './audit.service.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../types/index.js';
import { DraftBody } from '../validators/prescription.validator.js';
import { RECORD_TYPE_TO_CATEGORY, deriveClassification, normalizeSpecialization } from '../config/taxonomy.js';

// ── Formatting shared with the patient's record text ────────────────────────

const half = (n: number) => (n === 0.5 ? '½' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);
export const dosagePattern = (d: IRxMedicine['dosage']) => `${half(d.morning)}-${half(d.afternoon)}-${half(d.night)}`;
const FREQ_TEXT: Record<RxFrequency, string> = {
  DAILY: 'Daily',
  ALTERNATE_DAYS: 'Alternate days',
  WEEKLY: 'Weekly',
  SOS: 'SOS (as needed)',
  CUSTOM: 'Custom',
};
const frequencyText = (m: Pick<IRxMedicine, 'frequency' | 'frequencyCustom'>) =>
  m.frequency === 'CUSTOM' && m.frequencyCustom ? m.frequencyCustom : FREQ_TEXT[m.frequency];
const durationText = (m: Pick<IRxMedicine, 'duration'>) =>
  m.duration?.value ? `${m.duration.value} ${m.duration.unit.toLowerCase()}` : '';

const ageFrom = (dob?: Date | null) => (dob ? Math.floor((Date.now() - +new Date(dob)) / (365.25 * 24 * 3600 * 1000)) : undefined);
const SLOT_TIMES = { morning: '08:00', afternoon: '14:00', night: '21:00' } as const;

/** One line per medicine/test, used for the patient's record and the AI advisor */
export function prescriptionSummary(rx: Pick<IPrescription, 'medicines' | 'labTests' | 'nextVisitDate'>) {
  const lines = [...rx.medicines]
    .sort((a, b) => a.order - b.order)
    .map((m, i) => {
      const parts = [`${i + 1}) ${m.name}${m.strength ? ` ${m.strength}` : ''}`, dosagePattern(m.dosage), [frequencyText(m), durationText(m)].filter(Boolean).join(' - ')];
      if (m.timing) parts.push(m.timing);
      if (m.note) parts.push(m.note);
      return parts.join(' | ');
    });
  if (rx.labTests.length) lines.push(`Tests: ${rx.labTests.map((t) => t.name + (t.note ? ` (${t.note})` : '')).join(', ')}`);
  if (rx.nextVisitDate) lines.push(`Next visit: ${new Date(rx.nextVisitDate).toISOString().slice(0, 10)}`);
  return lines.join('\n');
}

const toClient = (rx: any) => ({
  ...rx,
  id: String(rx._id),
  medicines: [...(rx.medicines ?? [])].sort((a: any, b: any) => a.order - b.order).map((m: any) => ({ ...m, id: String(m._id), medicineId: String(m.medicine) })),
  labTests: [...(rx.labTests ?? [])].sort((a: any, b: any) => a.order - b.order).map((t: any) => ({ ...t, id: String(t._id), labTestId: t.labTest ? String(t.labTest) : undefined })),
});

// ── Service ─────────────────────────────────────────────────────────────────

export class PrescriptionService {
  /** Patients this doctor may prescribe for: those with an approved, unexpired connection */
  static async connectedPatients(caller: IJwtPayload) {
    const grants = await AccessGrant.find({
      doctorId: caller.publicId,
      status: 'APPROVED',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select('patientId')
      .lean();
    const ids = [...new Set(grants.map((g: any) => g.patientId))];
    const profiles = await PatientProfile.find({ patientId: { $in: ids } }).select('user patientId dateOfBirth gender').lean();
    const users = new Map((await User.find({ _id: { $in: profiles.map((p) => p.user) } }).select('name').lean()).map((u) => [String(u._id), u.name]));
    return profiles
      .map((p) => ({ patientId: p.patientId, name: users.get(String(p.user)) ?? p.patientId, age: ageFrom(p.dateOfBirth), gender: p.gender }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private static async resolvePatient(caller: IJwtPayload, rawPatientId: string) {
    const patientId = rawPatientId.trim().toUpperCase();
    const profile = await PatientProfile.findOne({ patientId }).lean();
    if (!profile) throw new AppError('Patient not found', 404);
    if (!(await AccessGrantService.hasApprovedAccess(caller.publicId, patientId))) {
      throw new AppError('Access Denied: Patient consent is required before writing a prescription.', 403);
    }
    const user = await User.findById(profile.user).select('name').lean();
    return { profile, snapshot: { name: user?.name ?? patientId, age: ageFrom(profile.dateOfBirth), gender: profile.gender } };
  }

  private static async buildMedicines(caller: IJwtPayload, lines: NonNullable<DraftBody['medicines']>) {
    if (!lines.length) return [];
    const meds = await MedicineService.assertVisible(caller, lines.map((l) => l.medicineId));
    return lines.map((l, i) => {
      const m = meds.get(l.medicineId)!;
      return {
        medicine: m._id,
        name: m.brandName,
        strength: m.strength,
        form: m.form,
        genericName: m.genericName,
        dosage: l.dosage,
        frequency: l.frequency,
        frequencyCustom: l.frequency === 'CUSTOM' ? l.frequencyCustom : undefined,
        duration: l.duration ?? undefined,
        timing: l.timing || undefined,
        note: l.note || undefined,
        order: i,
      };
    });
  }

  private static async buildLabTests(caller: IJwtPayload, lines: NonNullable<DraftBody['labTests']>) {
    const out = [];
    for (const [i, l] of lines.entries()) {
      let test: any = null;
      if (l.labTestId) {
        test = await LabTest.findOne({
          _id: l.labTestId,
          $or: [{ createdByDoctor: null }, { createdByDoctor: new Types.ObjectId(caller.userId) }],
        }).lean();
        if (!test) throw new AppError('Lab test not found', 404);
      } else {
        test = await LabTestService.ensureCustom(caller, l.name!);
      }
      out.push({ labTest: test._id, name: test.name, note: l.note || undefined, status: 'PENDING' as LabTestStatus, order: i });
    }
    return out;
  }

  private static async applyBody(caller: IJwtPayload, rx: any, body: DraftBody) {
    if (body.date !== undefined) rx.date = new Date(body.date);
    if (body.complaints !== undefined) rx.complaints = body.complaints || undefined;
    if (body.diagnosis !== undefined) rx.diagnosis = body.diagnosis || undefined;
    if (body.comorbidities !== undefined) rx.comorbidities = [...new Set(body.comorbidities.map((c) => c.trim()))];
    if (body.medicines !== undefined) rx.medicines = await this.buildMedicines(caller, body.medicines);
    if (body.labTests !== undefined) {
      // keep the status of tests that were already on this prescription (e.g. after an amendment)
      const before = new Map((rx.labTests ?? []).map((t: any) => [t.name.toLowerCase(), t.status]));
      rx.labTests = (await this.buildLabTests(caller, body.labTests)).map((t) => ({ ...t, status: (before.get(t.name.toLowerCase()) as LabTestStatus) ?? 'PENDING' }));
    }
    if (body.nextVisitDate !== undefined) rx.nextVisitDate = body.nextVisitDate ? new Date(body.nextVisitDate) : undefined;
  }

  private static async ownOr404(caller: IJwtPayload, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Prescription not found', 404);
    const rx = await Prescription.findById(id);
    if (!rx || String(rx.doctor) !== caller.userId) throw new AppError('Prescription not found', 404);
    return rx;
  }

  // ── Doctor: drafts ─────────────────────────────────────────────────────

  static async createDraft(caller: IJwtPayload, input: DraftBody & { patientId: string }) {
    await PrescriptionTemplateService.requireLocked(caller.userId);
    const { profile, snapshot } = await this.resolvePatient(caller, input.patientId);
    const _id = new Types.ObjectId();
    const rx: any = new Prescription({
      _id,
      rootId: _id,
      doctor: new Types.ObjectId(caller.userId),
      doctorId: caller.publicId,
      patient: profile.user,
      patientId: profile.patientId,
      patientSnapshot: snapshot,
      date: new Date(),
      status: 'DRAFT',
    });
    await this.applyBody(caller, rx, input);
    await rx.save();
    return toClient(rx.toObject());
  }

  /** Autosave target: only the doctor's own drafts can change */
  static async updateDraft(caller: IJwtPayload, id: string, body: DraftBody) {
    const rx: any = await this.ownOr404(caller, id);
    if (rx.status !== 'DRAFT') throw new AppError('This prescription has been issued and cannot be edited. Use Amend to create a new version.', 409);
    await this.applyBody(caller, rx, body);
    await rx.save();
    return toClient(rx.toObject());
  }

  static async deleteDraft(caller: IJwtPayload, id: string) {
    const rx = await this.ownOr404(caller, id);
    if (rx.status !== 'DRAFT') throw new AppError('Only drafts can be deleted.', 409);
    await rx.deleteOne();
    return { deleted: true };
  }

  // ── Doctor: issue / amend / duplicate ─────────────────────────────────

  static async issue(caller: IJwtPayload, id: string, ctx: { ip?: string; userAgent?: string } = {}) {
    const rx: any = await this.ownOr404(caller, id);
    if (rx.status !== 'DRAFT') throw new AppError('This prescription has already been issued.', 409);
    const letterhead = await PrescriptionTemplateService.requireLocked(caller.userId);
    const { profile, snapshot } = await this.resolvePatient(caller, rx.patientId);

    if (!rx.medicines.length && !rx.labTests.length) throw new AppError('Add at least one medicine or test before issuing.', 400);
    for (const m of rx.medicines as IRxMedicine[]) {
      const total = m.dosage.morning + m.dosage.afternoon + m.dosage.night;
      if (m.frequency !== 'SOS' && total <= 0) throw new AppError('Each medicine needs a dosage (for example 1-0-1), unless it is SOS.', 400);
      if (m.frequency !== 'SOS' && !m.duration?.value) throw new AppError('Each medicine needs a duration, unless it is SOS.', 400);
      if (m.frequency === 'CUSTOM' && !m.frequencyCustom) throw new AppError('Describe the custom frequency for each medicine that uses it.', 400);
    }

    const previous: any = rx.amendsId ? await Prescription.findById(rx.amendsId) : null;
    if (rx.amendsId && (!previous || previous.status !== 'ISSUED')) throw new AppError('The prescription being amended is no longer current.', 409);

    const doctorUser = await User.findById(caller.userId).select('name').lean();
    const doctorProfile = await DoctorProfile.findOne({ user: caller.userId }).lean();
    const summary = prescriptionSummary(rx);
    const title = rx.diagnosis ? `Prescription: ${rx.diagnosis}` : 'Prescription';

    // The patient's record: created on first issue, updated (never duplicated) by amendments
    let recordId = previous?.record;
    if (recordId) {
      await MedicalRecord.updateOne(
        { _id: recordId },
        { $set: { title: `${title} (v${rx.version})`.slice(0, 200), description: summary, diagnosis: rx.diagnosis, recordDate: rx.date, prescription: rx._id } }
      );
    } else {
      const suggestion = ClassificationService.keywordSuggest({
        title,
        recordType: 'PRESCRIPTION',
        diagnosis: [rx.diagnosis, ...(rx.comorbidities ?? [])].filter(Boolean).join(', '),
        description: summary,
        tags: rx.comorbidities ?? [],
      } as any);
      const spec = normalizeSpecialization((doctorProfile as any)?.specialization);
      const derived = deriveClassification({
        category: RECORD_TYPE_TO_CATEGORY.PRESCRIPTION,
        conditions: suggestion.conditions,
        forceSensitive: suggestion.sensitive,
        extraSpecializations: spec ? [spec] : [],
      });
      const record = await MedicalRecord.create({
        patient: profile.user,
        patientId: profile.patientId,
        uploadedBy: new Types.ObjectId(caller.userId),
        uploaderRole: 'DOCTOR',
        recordType: 'PRESCRIPTION',
        title: title.slice(0, 200),
        recordDate: rx.date,
        doctorName: letterhead.header.doctorName,
        facilityName: letterhead.footer.clinicName,
        description: summary,
        diagnosis: rx.diagnosis,
        tags: rx.comorbidities ?? [],
        classification: { ...derived, source: 'UPLOADER_FORM', patientReviewed: false },
        prescription: rx._id,
      });
      recordId = record._id;
    }

    rx.status = 'ISSUED';
    rx.issuedAt = new Date();
    rx.letterhead = letterhead;
    rx.patientSnapshot = snapshot;
    rx.record = recordId;
    await rx.save();
    if (previous) {
      previous.status = 'SUPERSEDED';
      previous.supersededBy = rx._id;
      await previous.save();
    }

    await this.syncMedications(rx, recordId, letterhead.header.doctorName);
    await MedicineService.recordUsage(caller.userId, rx.medicines.map((m: IRxMedicine) => String(m.medicine)));

    await NotificationService.notify(profile.user, {
      type: 'PRESCRIPTION_ISSUED',
      title: 'New prescription',
      body: `${letterhead.header.doctorName} sent you a prescription.`,
      data: { doctorName: letterhead.header.doctorName, prescriptionId: String(rx._id), amended: previous ? 'true' : 'false' },
    });
    await AuditService.log({
      actor: { userId: caller.userId, publicId: caller.publicId, name: doctorUser?.name ?? caller.publicId, role: 'DOCTOR' },
      targetPatientId: profile.patientId,
      targetPatientUserId: String(profile.user),
      action: previous ? 'PRESCRIPTION_AMENDED' : 'PRESCRIPTION_ISSUED',
      details: `Prescription v${rx.version} (${rx.medicines.length} medicines, ${rx.labTests.length} tests)`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return toClient(rx.toObject());
  }

  /**
   * Put the medicines into the patient's Medications tracker. On an amendment the previous version's
   * medicines are discontinued first so the tracker always matches the current prescription.
   */
  private static async syncMedications(rx: any, recordId: Types.ObjectId, doctorName: string) {
    await Medication.updateMany({ sourceRecordId: recordId, status: { $in: ['ACTIVE', 'PAUSED'] } }, { $set: { status: 'DISCONTINUED' } });
    const start = new Date(rx.date);
    const docs = (rx.medicines as IRxMedicine[]).map((m) => {
      const slots = (['morning', 'afternoon', 'night'] as const).filter((s) => m.dosage[s] > 0);
      let endDate: Date | undefined;
      if (m.duration?.value) {
        endDate = new Date(start);
        if (m.duration.unit === 'DAYS') endDate.setDate(endDate.getDate() + m.duration.value);
        if (m.duration.unit === 'WEEKS') endDate.setDate(endDate.getDate() + 7 * m.duration.value);
        if (m.duration.unit === 'MONTHS') endDate.setMonth(endDate.getMonth() + m.duration.value);
      }
      return {
        patient: rx.patient,
        patientId: rx.patientId,
        name: `${m.name}${m.strength && !m.name.includes(m.strength) ? ` ${m.strength}` : ''}`.slice(0, 150),
        genericName: m.genericName?.slice(0, 150),
        dosage: dosagePattern(m.dosage),
        frequency: [frequencyText(m), durationText(m)].filter(Boolean).join(' - ').slice(0, 100),
        timesPerDay: slots.length || undefined,
        scheduleTimes: slots.map((s) => SLOT_TIMES[s]),
        timing: m.frequency === 'SOS' ? 'AS_NEEDED' : undefined,
        startDate: start,
        endDate,
        purpose: rx.diagnosis?.slice(0, 300),
        prescribingDoctor: doctorName.slice(0, 150),
        instructions: [m.timing, m.note].filter(Boolean).join(' · ').slice(0, 500) || undefined,
        status: 'ACTIVE',
        sourceRecordId: recordId,
        deduplicationKey: `rx:${rx._id}:${m._id}`,
      };
    });
    if (docs.length) await Medication.insertMany(docs);
  }

  /** Start a new version of an issued prescription (the issued one stays exactly as it was) */
  static async amend(caller: IJwtPayload, id: string) {
    await PrescriptionTemplateService.requireLocked(caller.userId);
    const rx: any = await this.ownOr404(caller, id);
    if (rx.status !== 'ISSUED') throw new AppError('Only the current issued version can be amended.', 409);
    const open = await Prescription.findOne({ amendsId: rx._id, status: 'DRAFT' }).lean();
    if (open) return toClient(open);
    const copy = new Prescription({
      rootId: rx.rootId,
      amendsId: rx._id,
      version: rx.version + 1,
      doctor: rx.doctor,
      doctorId: rx.doctorId,
      patient: rx.patient,
      patientId: rx.patientId,
      patientSnapshot: rx.patientSnapshot,
      date: new Date(),
      complaints: rx.complaints,
      diagnosis: rx.diagnosis,
      comorbidities: rx.comorbidities,
      medicines: rx.medicines.map((m: any) => ({ ...m.toObject(), _id: new Types.ObjectId() })),
      labTests: rx.labTests.map((t: any) => ({ ...t.toObject(), _id: new Types.ObjectId() })),
      nextVisitDate: rx.nextVisitDate,
      status: 'DRAFT',
    });
    await copy.save();
    return toClient(copy.toObject());
  }

  /** Reuse a past prescription as a new draft, for the same or another connected patient */
  static async duplicate(caller: IJwtPayload, id: string, patientId?: string) {
    await PrescriptionTemplateService.requireLocked(caller.userId);
    const rx: any = await this.ownOr404(caller, id);
    const target = await this.resolvePatient(caller, patientId ?? rx.patientId);
    // medicines must still be visible to this doctor (a private one could have been removed)
    await MedicineService.assertVisible(caller, rx.medicines.map((m: any) => String(m.medicine)));
    const _id = new Types.ObjectId();
    const copy = new Prescription({
      _id,
      rootId: _id,
      doctor: rx.doctor,
      doctorId: rx.doctorId,
      patient: target.profile.user,
      patientId: target.profile.patientId,
      patientSnapshot: target.snapshot,
      date: new Date(),
      complaints: rx.complaints,
      diagnosis: rx.diagnosis,
      comorbidities: rx.comorbidities,
      medicines: rx.medicines.map((m: any) => ({ ...m.toObject(), _id: new Types.ObjectId() })),
      labTests: rx.labTests.map((t: any) => ({ ...t.toObject(), _id: new Types.ObjectId(), status: 'PENDING' })),
      status: 'DRAFT',
    });
    await copy.save();
    return toClient(copy.toObject());
  }

  // ── Reading ─────────────────────────────────────────────────────────────

  static async listForDoctor(caller: IJwtPayload, opts: { patientId?: string; status?: string } = {}) {
    const filter: any = { doctor: new Types.ObjectId(caller.userId) };
    if (opts.patientId) filter.patientId = opts.patientId.trim().toUpperCase();
    if (opts.status && ['DRAFT', 'ISSUED', 'SUPERSEDED'].includes(opts.status)) filter.status = opts.status;
    const rows = await Prescription.find(filter)
      .select('patientId patientSnapshot date diagnosis status version medicines.name labTests.name issuedAt updatedAt amendsId rootId')
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();
    return rows.map((r: any) => ({
      id: String(r._id),
      patientId: r.patientId,
      patientName: r.patientSnapshot?.name,
      date: r.date,
      diagnosis: r.diagnosis,
      status: r.status,
      version: r.version,
      medicines: r.medicines.map((m: any) => m.name),
      tests: r.labTests.map((t: any) => t.name),
      issuedAt: r.issuedAt,
      updatedAt: r.updatedAt,
      isAmendment: Boolean(r.amendsId),
    }));
  }

  /** Doctors read their own prescriptions; patients read their own issued (and superseded) ones */
  static async get(caller: IJwtPayload, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Prescription not found', 404);
    const rx: any = await Prescription.findById(id).lean();
    const allowed =
      rx &&
      ((caller.role === 'DOCTOR' && String(rx.doctor) === caller.userId) ||
        (caller.role === 'PATIENT' && String(rx.patient) === caller.userId && rx.status !== 'DRAFT'));
    if (!allowed) throw new AppError('Prescription not found', 404);
    const versions = await Prescription.find({ rootId: rx.rootId, status: { $ne: 'DRAFT' } })
      .select('version status issuedAt')
      .sort({ version: 1 })
      .lean();
    return { ...toClient(rx), versions: versions.map((v: any) => ({ id: String(v._id), version: v.version, status: v.status, issuedAt: v.issuedAt })) };
  }

  static async listForPatient(caller: IJwtPayload) {
    const rows = await Prescription.find({ patient: new Types.ObjectId(caller.userId), status: 'ISSUED' })
      .select('date diagnosis letterhead.header letterhead.footer.clinicName version medicines.name labTests issuedAt nextVisitDate')
      .sort({ date: -1, issuedAt: -1 })
      .lean();
    return rows.map((r: any) => ({
      id: String(r._id),
      date: r.date,
      diagnosis: r.diagnosis,
      doctorName: r.letterhead?.header?.doctorName,
      specialization: r.letterhead?.header?.specialization,
      clinicName: r.letterhead?.footer?.clinicName,
      version: r.version,
      medicines: r.medicines.map((m: any) => m.name),
      testsPending: r.labTests.filter((t: any) => t.status !== 'DONE').length,
      nextVisitDate: r.nextVisitDate,
      issuedAt: r.issuedAt,
    }));
  }

  /** "Tests to do": every test on the patient's current prescriptions that is not done yet */
  static async testsToDo(caller: IJwtPayload) {
    const rows = await Prescription.find({ patient: new Types.ObjectId(caller.userId), status: 'ISSUED', 'labTests.0': { $exists: true } })
      .select('date letterhead.header.doctorName labTests')
      .sort({ date: -1 })
      .lean();
    return rows.flatMap((r: any) =>
      r.labTests
        .filter((t: any) => t.status !== 'DONE')
        .sort((a: any, b: any) => a.order - b.order)
        .map((t: any) => ({
          prescriptionId: String(r._id),
          testId: String(t._id),
          name: t.name,
          note: t.note,
          status: t.status,
          date: r.date,
          doctorName: r.letterhead?.header?.doctorName,
        }))
    );
  }

  static async setLabTestStatus(caller: IJwtPayload, id: string, testId: string, status: LabTestStatus) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(testId)) throw new AppError('Prescription not found', 404);
    const res = await Prescription.updateOne(
      { _id: id, patient: new Types.ObjectId(caller.userId), status: 'ISSUED', 'labTests._id': new Types.ObjectId(testId) },
      { $set: { 'labTests.$.status': status } }
    );
    if (!res.matchedCount) throw new AppError('Prescription not found', 404);
    return { status };
  }
}
