import { tr, getLocale } from '../context/LanguageContext.js';
import { enumLabel } from './enumLabel.js';

interface NotificationLike {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Renders a notification in the user's language from its type and data. The server's English title/body are
 * only the fallback for unknown types or missing data, so old notifications keep working.
 */
export function notificationText(n: NotificationLike): { title: string; body: string } {
  const d = n.data ?? {};
  switch (n.type) {
    case 'ACCESS_REQUEST_RECEIVED':
      if (d.doctorName)
        return {
          title: tr('New access request'),
          body: tr('{doctor} ({specialty}) is asking to view some of your records.', {
            doctor: d.doctorName,
            specialty: enumLabel(d.specialization),
          }),
        };
      break;
    case 'ACCESS_REQUEST_APPROVED':
      if (d.patientName && d.expiresAt)
        return {
          title: tr('Access request approved'),
          body: tr('{patient} approved your request. Access lasts until {date}.', {
            patient: d.patientName,
            date: new Date(d.expiresAt).toLocaleString(getLocale()),
          }),
        };
      break;
    case 'ACCESS_REQUEST_REJECTED':
      if (d.patientName)
        return {
          title: tr('Access request declined'),
          body: tr('{patient} declined your request for additional records.', { patient: d.patientName }),
        };
      break;
    case 'CONSENT_REVOKED':
      if (d.patientName)
        return {
          title: tr('Access revoked'),
          body: tr('{patient} revoked the additional record access you had been granted.', { patient: d.patientName }),
        };
      break;
    case 'CONSENT_EXPIRING':
      return {
        title: tr('Access expiring soon'),
        body: tr('Additional record access granted to you ends within the hour.'),
      };
    case 'RECORD_NEEDS_REVIEW':
      return d.suggested === 'true'
        ? { title: tr('We tagged your new record'), body: tr('Check the suggested tags so the right specialists can see it.') }
        : {
            title: tr('Please tag your new record'),
            body: tr('Add tags so the right specialists can see it. Until then only you can open it.'),
          };
    case 'CONNECTION_REQUESTED':
      if (d.doctorName)
        return {
          title: tr('A doctor wants to connect'),
          body: tr('{doctor} asked for access to your health chart.', { doctor: d.doctorName }),
        };
      break;
    case 'CONNECTION_RESPONDED':
      if (d.patientName && d.outcome === 'approved')
        return { title: tr('Patient responded'), body: tr('{patient} approved your access request.', { patient: d.patientName }) };
      if (d.patientName && d.outcome === 'rejected')
        return { title: tr('Patient responded'), body: tr('{patient} rejected your access request.', { patient: d.patientName }) };
      if (d.patientName && d.outcome === 'revoked')
        return { title: tr('Patient responded'), body: tr('{patient} revoked your access request.', { patient: d.patientName }) };
      break;
  }
  return { title: n.title, body: n.body };
}
