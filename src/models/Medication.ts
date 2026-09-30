import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Status lifecycle: ACTIVE → PAUSED | DISCONTINUED | COMPLETED ──────────────
export type MedicationLifecycleStatus = 'ACTIVE' | 'PAUSED' | 'DISCONTINUED' | 'COMPLETED';
export type RouteOfAdmin = 'ORAL' | 'TOPICAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'INHALATION' | 'NASAL' | 'OPHTHALMIC' | 'OTIC' | 'RECTAL' | 'SUBLINGUAL' | 'TRANSDERMAL' | 'OTHER';
export type DoseTiming = 'BEFORE_MEAL' | 'WITH_MEAL' | 'AFTER_MEAL' | 'BEDTIME' | 'MORNING' | 'EVENING' | 'AS_NEEDED' | 'ANY_TIME';

export interface IMedication extends Document {
  _id: Types.ObjectId;
  /** Owner – always set from JWT, never from request body */
  patient: Types.ObjectId;
  /** Public patient ID for indexed lookups */
  patientId: string;

  // ── Core identity ─────────────────────────────────────────────────────────
  name: string;            // Brand name (e.g. Glucophage)
  genericName?: string;    // Generic name (e.g. Metformin)

  // ── Dosing ───────────────────────────────────────────────────────────────
  dosage: string;          // e.g. "500mg", "1 tablet"
  unit?: string;           // e.g. "mg", "mcg", "ml"
  frequency: string;       // e.g. "Twice daily"
  timesPerDay?: number;    // numeric hint for schedule generation (1, 2, 3…)
  scheduleTimes?: string[];// ["08:00", "20:00"] – used by dose scheduler
  route?: RouteOfAdmin;
  timing?: DoseTiming;

  // ── Dates ─────────────────────────────────────────────────────────────────
  startDate: Date;
  endDate?: Date;

  // ── Meta ─────────────────────────────────────────────────────────────────
  purpose?: string;        // Reason for prescription / condition treated
  prescribingDoctor?: string;
  instructions?: string;
  status: MedicationLifecycleStatus;

  // ── Prescription linkage (avoids duplicates when extracted from docs) ────
  /** sourceRecordId links this to a MedicalRecord with recordType=PRESCRIPTION */
  sourceRecordId?: Types.ObjectId;
  /** Fingerprint: name+dosage+startDate+patientId – used for dedup check */
  deduplicationKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: String, required: true, index: true, trim: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    genericName: { type: String, trim: true, maxlength: 150 },

    dosage: { type: String, required: true, trim: true, maxlength: 80 },
    unit: { type: String, trim: true, maxlength: 30 },
    frequency: { type: String, required: true, trim: true, maxlength: 100 },
    timesPerDay: { type: Number, min: 1, max: 24 },
    scheduleTimes: [{ type: String, match: /^\d{2}:\d{2}$/ }],
    route: {
      type: String,
      enum: ['ORAL','TOPICAL','INTRAVENOUS','INTRAMUSCULAR','SUBCUTANEOUS','INHALATION','NASAL','OPHTHALMIC','OTIC','RECTAL','SUBLINGUAL','TRANSDERMAL','OTHER'],
    },
    timing: {
      type: String,
      enum: ['BEFORE_MEAL','WITH_MEAL','AFTER_MEAL','BEDTIME','MORNING','EVENING','AS_NEEDED','ANY_TIME'],
    },

    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },

    purpose: { type: String, trim: true, maxlength: 300 },
    prescribingDoctor: { type: String, trim: true, maxlength: 150 },
    instructions: { type: String, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DISCONTINUED', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },

    sourceRecordId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
    deduplicationKey: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

// Compound indexes for common queries
MedicationSchema.index({ patientId: 1, status: 1 });
MedicationSchema.index({ patientId: 1, startDate: -1 });
MedicationSchema.index({ patient: 1, status: 1, startDate: -1 });

export const Medication = mongoose.model<IMedication>('Medication', MedicationSchema);
