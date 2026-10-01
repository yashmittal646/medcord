import { tr, getLocale } from '../../context/LanguageContext.js';
import { tx } from '../../i18n/index.js';

export type RxFrequency = 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKLY' | 'SOS' | 'CUSTOM';
export type RxDurationUnit = 'DAYS' | 'WEEKS' | 'MONTHS';
export type LabStatus = 'PENDING' | 'UPLOADED' | 'DONE';

export interface Letterhead {
  header: { doctorName: string; qualification?: string; specialization?: string; registrationNumber?: string };
  footer: { clinicName?: string; clinicAddress: string; phone: string };
}

export interface RxMedicineLine {
  /** client-side row key */
  key: string;
  medicineId: string;
  name: string;
  strength?: string;
  form?: string;
  genericName?: string;
  dosage: { morning: number; afternoon: number; night: number };
  frequency: RxFrequency;
  frequencyCustom?: string;
  duration?: { value: number; unit: RxDurationUnit } | null;
  timing?: string;
  /** true once the doctor typed their own timing (stop auto-suggesting) */
  timingEdited?: boolean;
  note?: string;
}

export interface RxLabLine {
  key: string;
  labTestId?: string;
  name: string;
  note?: string;
  status?: LabStatus;
}

export interface RxDocument {
  date: string;
  patient: { name: string; age?: number; gender?: string; patientId: string };
  complaints?: string;
  diagnosis?: string;
  comorbidities: string[];
  medicines: RxMedicineLine[];
  labTests: RxLabLine[];
  nextVisitDate?: string | null;
  letterhead: Letterhead;
  version?: number;
  status?: string;
}

export const FREQUENCIES: { value: RxFrequency; label: string }[] = [
  { value: 'DAILY', label: tx('Daily') },
  { value: 'ALTERNATE_DAYS', label: tx('Alternate days') },
  { value: 'WEEKLY', label: tx('Weekly') },
  { value: 'SOS', label: tx('SOS / as needed') },
  { value: 'CUSTOM', label: tx('Custom') },
];
export const DURATION_UNITS: { value: RxDurationUnit; one: string; many: string }[] = [
  { value: 'DAYS', one: tx('{n} day'), many: tx('{n} days') },
  { value: 'WEEKS', one: tx('{n} week'), many: tx('{n} weeks') },
  { value: 'MONTHS', one: tx('{n} month'), many: tx('{n} months') },
];
export const UNIT_LABELS: Record<RxDurationUnit, string> = { DAYS: tx('days'), WEEKS: tx('weeks'), MONTHS: tx('months') };

export const DOSAGE_PRESETS: [number, number, number][] = [
  [1, 0, 1],
  [1, 0, 0],
  [0, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
];

export const half = (n: number) => (n === 0.5 ? '½' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);
export const dosagePattern = (d: RxMedicineLine['dosage']) => `${half(d.morning)}-${half(d.afternoon)}-${half(d.night)}`;

export const frequencyLabel = (m: Pick<RxMedicineLine, 'frequency' | 'frequencyCustom'>) =>
  m.frequency === 'CUSTOM' && m.frequencyCustom ? m.frequencyCustom : tr(FREQUENCIES.find((f) => f.value === m.frequency)?.label ?? 'Daily');

export const durationLabel = (d?: RxMedicineLine['duration']) => {
  if (!d?.value) return '';
  const u = DURATION_UNITS.find((x) => x.value === d.unit)!;
  return tr(d.value === 1 ? u.one : u.many, { n: d.value });
};

/** "29 Apr 2026 - Wednesday" */
export const visitDateLabel = (iso: string) => {
  const d = new Date(iso);
  const locale = getLocale();
  return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} - ${d.toLocaleDateString(locale, { weekday: 'long' })}`;
};

/** "1 - Morning, 1 - Night" from the dosage (the doctor can overwrite it) */
export const suggestTiming = (d: RxMedicineLine['dosage'], frequency: RxFrequency) => {
  if (frequency === 'SOS') return tr('When needed');
  const parts: string[] = [];
  if (d.morning) parts.push(`${half(d.morning)} - ${tr('Morning')}`);
  if (d.afternoon) parts.push(`${half(d.afternoon)} - ${tr('Afternoon')}`);
  if (d.night) parts.push(`${half(d.night)} - ${tr('Night')}`);
  return parts.join(', ');
};

export const COMORBIDITY_SUGGESTIONS = [tx('Diabetes'), tx('Hypertension'), tx('Thyroid disorder'), tx('Asthma'), tx('Heart disease'), tx('Kidney disease')];

export const newKey = () => Math.random().toString(36).slice(2, 10);

/** API prescription -> editor/document shape */
export function fromApi(rx: any): Omit<RxDocument, 'letterhead'> & { letterhead?: Letterhead } {
  return {
    date: rx.date,
    patient: {
      name: rx.patientSnapshot?.name ?? rx.patientId,
      age: rx.patientSnapshot?.age,
      gender: rx.patientSnapshot?.gender,
      patientId: rx.patientId,
    },
    complaints: rx.complaints ?? '',
    diagnosis: rx.diagnosis ?? '',
    comorbidities: rx.comorbidities ?? [],
    medicines: (rx.medicines ?? []).map((m: any) => ({
      key: m.id ?? newKey(),
      medicineId: m.medicineId,
      name: m.name,
      strength: m.strength,
      form: m.form,
      genericName: m.genericName,
      dosage: m.dosage ?? { morning: 0, afternoon: 0, night: 0 },
      frequency: m.frequency ?? 'DAILY',
      frequencyCustom: m.frequencyCustom,
      duration: m.duration?.value ? m.duration : null,
      timing: m.timing,
      timingEdited: Boolean(m.timing),
      note: m.note,
    })),
    labTests: (rx.labTests ?? []).map((t: any) => ({ key: t.id ?? newKey(), labTestId: t.labTestId, name: t.name, note: t.note, status: t.status })),
    nextVisitDate: rx.nextVisitDate ?? null,
    letterhead: rx.letterhead,
    version: rx.version,
    status: rx.status,
  };
}

/** Editor state -> PATCH body */
export const toApiBody = (doc: Pick<RxDocument, 'date' | 'complaints' | 'diagnosis' | 'comorbidities' | 'medicines' | 'labTests' | 'nextVisitDate'>) => ({
  date: doc.date,
  complaints: doc.complaints ?? '',
  diagnosis: doc.diagnosis ?? '',
  comorbidities: doc.comorbidities,
  medicines: doc.medicines
    .filter((m) => m.medicineId)
    .map((m) => ({
      medicineId: m.medicineId,
      dosage: m.dosage,
      frequency: m.frequency,
      frequencyCustom: m.frequency === 'CUSTOM' ? m.frequencyCustom ?? '' : undefined,
      duration: m.duration?.value ? m.duration : null,
      timing: m.timing ?? '',
      note: m.note ?? '',
    })),
  labTests: doc.labTests.filter((t) => t.labTestId || t.name.trim()).map((t) => ({ labTestId: t.labTestId, name: t.labTestId ? undefined : t.name, note: t.note ?? '' })),
  nextVisitDate: doc.nextVisitDate || null,
});
