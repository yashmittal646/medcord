import type { MedicalRecord, MedicalRecordType } from './types.js';
import { enumLabel } from '../../utils/enumLabel.js';

/** Document category (server classification) -> timeline type */
const CATEGORY_TYPE: Record<string, MedicalRecordType> = {
  BLOOD_WORK: 'lab_report',
  CARDIAC_TEST: 'lab_report',
  BIOPSY_PATHOLOGY: 'lab_report',
  IMAGING: 'imaging',
  PRESCRIPTION: 'prescription',
  VACCINATION: 'vaccination',
  CONSULTATION: 'consultation',
  DISCHARGE_SUMMARY: 'consultation',
};

/** Legacy record type -> timeline type, used when a record has no finer category */
const RECORD_TYPE_TYPE: Record<string, MedicalRecordType> = {
  PRESCRIPTION: 'prescription',
  LAB_REPORT: 'lab_report',
  CONSULTATION: 'consultation',
  CHECKUP: 'consultation',
  OTHER: 'consultation',
};

/** Events from GET /timeline or /doctor/patient/:id/timeline */
export function fromTimelineEvents(events: any[]): MedicalRecord[] {
  return events.map((e) => ({
    id: `record-${e.id}`,
    recordId: String(e.id),
    date: e.recordDate,
    type: CATEGORY_TYPE[e.category] ?? RECORD_TYPE_TYPE[e.recordType] ?? 'consultation',
    title: e.title,
    doctorName: e.doctorName,
    facility: e.facilityName,
    description: [e.diagnosis, e.description].filter(Boolean).join('\n\n'),
    tags: e.tags ?? [],
    hasFile: Boolean(e.hasAttachment),
  }));
}

interface ClinicalProfile {
  allergies?: any[];
  chronicConditions?: any[];
  currentMedications?: any[];
}

/**
 * Diagnoses, medications and allergies from the medical profile. Entries without a date are placed at
 * `fallbackDate` (usually the profile's creation) so they still appear in the feed.
 */
export function fromClinicalProfile(profile: ClinicalProfile | null | undefined, fallbackDate?: string): MedicalRecord[] {
  if (!profile) return [];
  const fallback = fallbackDate ?? new Date().toISOString();
  const out: MedicalRecord[] = [];

  (profile.chronicConditions ?? []).forEach((c, i) => {
    out.push({
      id: `diagnosis-${c._id ?? i}`,
      date: c.diagnosedDate ?? fallback,
      type: 'diagnosis',
      title: c.condition,
      description: c.notes ?? '',
      status: enumLabel(c.status),
    });
  });

  (profile.currentMedications ?? []).forEach((m, i) => {
    out.push({
      id: `medication-${m._id ?? i}`,
      date: m.startDate ?? fallback,
      type: 'medication',
      title: `${m.medicine} ${m.dosage ?? ''}`.trim(),
      description: m.frequency ?? '',
      status: enumLabel(m.status ?? 'ACTIVE'),
    });
  });

  (profile.allergies ?? []).forEach((a, i) => {
    out.push({
      id: `allergy-${a._id ?? i}`,
      date: a.addedAt ?? fallback,
      type: 'allergy',
      title: a.substance,
      description: a.notes ?? '',
      status: enumLabel(a.severity),
      critical: a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING',
    });
  });

  return out;
}

/** Turns a timeline event back into the record shape the document viewer expects */
export const eventToDocument = (e: any) => ({
  _id: e.id,
  title: e.title,
  recordType: e.recordType,
  recordDate: e.recordDate,
  doctorName: e.doctorName,
  facilityName: e.facilityName,
  description: e.description,
  diagnosis: e.diagnosis,
  tags: e.tags,
  file: e.hasAttachment ? { originalName: e.fileDetails?.originalName } : undefined,
});
