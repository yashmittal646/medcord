export type MedicalRecordType =
  | 'consultation'
  | 'lab_report'
  | 'prescription'
  | 'medication'
  | 'vaccination'
  | 'imaging'
  | 'diagnosis'
  | 'allergy';

export interface MetricItem {
  label: string;
  value: string;
  status?: 'normal' | 'warning' | 'critical';
}

export interface MedicalRecord {
  id: string;
  /** ISO format: "2026-03-15" or "2026-03-15T10:30:00Z" */
  date: string;
  type: MedicalRecordType;
  title: string;
  doctorName?: string;
  facility?: string;
  description: string;
  tags?: string[];
  metrics?: MetricItem[];
  fileUrl?: string;
  /** Uploaded document behind this entry; opened through the authenticated API rather than a raw URL */
  recordId?: string;
  hasFile?: boolean;
  /** Short status label, e.g. an allergy's severity or a medication's status */
  status?: string;
  /** Highlights the entry (life-threatening allergy, etc.) */
  critical?: boolean;
}

export const RECORD_TYPES: MedicalRecordType[] = [
  'consultation',
  'lab_report',
  'prescription',
  'medication',
  'vaccination',
  'imaging',
  'diagnosis',
  'allergy',
];
