import { AuditActionType } from '../types/index.js';

/**
 * Human-readable descriptions of audit events, as translatable templates.
 * The API sends `messageKey` (an English template with {placeholders}) plus `params`; the client looks the
 * template up in the user's language. `message` is the same text filled in for English and API consumers.
 * Every template here must exist in the client dictionaries (client `npm run i18n:check` verifies it).
 */
export interface AuditMessage {
  key: string;
  params: Record<string, string>;
  message: string;
  badge: string;
}

interface LogLike {
  action: AuditActionType | string;
  details?: string;
  targetPatientId?: string;
  actor: { name: string; publicId: string; role: string };
}

const m = (key: string, badge: string) => ({ key, badge });

export const fillTemplate = (template: string, params: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, k) => (k in params ? params[k] : match));

const PATIENT_VIEW: Record<string, { key: string; badge: string }> = {
  DOCTOR_LOOKUP: m('Doctor {name} ({id}) viewed your medical chart', 'DOCTOR_VIEW'),
  EMERGENCY_ACCESS: m('EMERGENCY ACCESS: Doctor {name} ({id}) accessed your critical emergency dataset', 'EMERGENCY'),
  HEALTH_PATH_CREATED: m('Doctor {name} initiated a new active Health Path treatment', 'HEALTH_PATH'),
  PRESCRIPTION_ISSUED: m('Doctor {name} ({id}) issued you a prescription', 'RECORD'),
  PRESCRIPTION_AMENDED: m('Doctor {name} ({id}) amended your prescription', 'RECORD'),
  HEALTH_PATH_UPDATED: m('A Health Path was updated', 'HEALTH_PATH'),
  HEALTH_PATH_COMPLETED: m('Health Path treatment was marked completed', 'HEALTH_PATH'),
  HEALTH_PATH_ARCHIVED: m('Health Path was archived', 'HEALTH_PATH'),
  RECORD_UPLOAD: m('New medical record uploaded', 'RECORD'),
  RECORD_VIEW: m('Doctor {name} ({id}) opened one of your records', 'DOCTOR_VIEW'),
  RECORD_DOWNLOAD: m('Doctor {name} ({id}) downloaded a document from your records', 'DOCTOR_VIEW'),
  RECORD_ACCESS_DENIED: m('{name} ({id}) tried to open a record they are not permitted to see. Access was blocked.', 'BLOCKED'),
  CONNECTION_REQUESTED: m('Doctor {name} ({id}) asked to connect to your chart', 'ACCESS_REQUEST'),
  CONNECTION_APPROVED: m('You approved a doctor’s connection to your chart', 'CONSENT'),
  CONNECTION_REJECTED: m('You declined a doctor’s connection to your chart', 'CONSENT'),
  CONNECTION_REVOKED: m('You revoked a doctor’s connection to your chart', 'CONSENT'),
  ACCESS_REQUEST_CREATED: m('Doctor {name} ({id}) requested access to additional records', 'ACCESS_REQUEST'),
  ACCESS_REQUEST_CANCELLED: m('Doctor {name} withdrew an access request', 'ACCESS_REQUEST'),
  ACCESS_REQUEST_REJECTED: m('You declined an access request', 'CONSENT'),
  CONSENT_GRANTED: m('You approved access to additional records', 'CONSENT'),
  CONSENT_REVOKED: m('You revoked a doctor’s access to additional records', 'CONSENT'),
  CONSENT_EXPIRED: m('A time-limited access grant expired', 'CONSENT'),
  CLASSIFICATION_CHANGED: m('You changed who can see a record', 'RECORD'),
  PROFILE_UPDATE: m('Your profile was updated', 'GENERAL'),
  LOGIN: m('You signed in', 'GENERAL'),
};

const DOCTOR_VIEW: Record<string, { key: string; badge: string }> = {
  LOGIN: m('You signed in', 'GENERAL'),
  DOCTOR_LOOKUP: m('You opened the chart of patient {patient}', 'DOCTOR_VIEW'),
  EMERGENCY_ACCESS: m('You used Emergency Access for patient {patient}', 'EMERGENCY'),
  HEALTH_PATH_CREATED: m('You created a Health Path for patient {patient}', 'HEALTH_PATH'),
  PRESCRIPTION_ISSUED: m('You issued a prescription for patient {patient}', 'RECORD'),
  PRESCRIPTION_AMENDED: m('You amended a prescription for patient {patient}', 'RECORD'),
  HEALTH_PATH_UPDATED: m('You updated a Health Path for patient {patient}', 'HEALTH_PATH'),
  HEALTH_PATH_COMPLETED: m('You completed a Health Path for patient {patient}', 'HEALTH_PATH'),
  HEALTH_PATH_ARCHIVED: m('You archived a Health Path for patient {patient}', 'HEALTH_PATH'),
  RECORD_UPLOAD: m('You uploaded a record for patient {patient}', 'RECORD'),
  RECORD_VIEW: m('You opened a record of patient {patient}', 'DOCTOR_VIEW'),
  RECORD_DOWNLOAD: m('You downloaded a document of patient {patient}', 'DOCTOR_VIEW'),
  RECORD_ACCESS_DENIED: m('Your attempt to open a record of patient {patient} was blocked', 'BLOCKED'),
  RECORD_DELETE: m('You deleted a record you had uploaded for patient {patient}', 'RECORD'),
  CONNECTION_REQUESTED: m('You asked to connect to patient {patient}', 'ACCESS_REQUEST'),
  ACCESS_REQUEST_CREATED: m('You requested access to more records of patient {patient}', 'ACCESS_REQUEST'),
  ACCESS_REQUEST_CANCELLED: m('You withdrew your access request for patient {patient}', 'ACCESS_REQUEST'),
};

const PATIENT_DEFAULT = m('{name} performed an action on your records', 'GENERAL');
const DOCTOR_DEFAULT = m('Activity on patient {patient}', 'GENERAL');
const DOCTOR_DELETE_BY_DOCTOR = m('Doctor {name} deleted a medical record they had uploaded', 'RECORD');
const PATIENT_DELETE = m('You deleted a medical record', 'RECORD');

export function describeForPatient(log: LogLike): AuditMessage {
  const params = { name: log.actor.name, id: log.actor.publicId };
  let entry = PATIENT_VIEW[log.action] ?? PATIENT_DEFAULT;
  if (log.action === 'RECORD_DELETE') entry = log.actor.role === 'PATIENT' ? PATIENT_DELETE : DOCTOR_DELETE_BY_DOCTOR;
  return { key: entry.key, params, message: fillTemplate(entry.key, params), badge: entry.badge };
}

export function describeForDoctor(log: LogLike): AuditMessage {
  const params = { patient: log.targetPatientId ?? '' };
  const entry = DOCTOR_VIEW[log.action] ?? DOCTOR_DEFAULT;
  return { key: entry.key, params, message: fillTemplate(entry.key, params), badge: entry.badge };
}
