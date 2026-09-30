import { tr } from '../context/LanguageContext.js';
import { translateServerMessage } from '../utils/serverMessage.js';
const API_BASE = '/api';

/** Validation errors arrive as { field: message }; translate each message */
function translateFieldErrors(errors: unknown) {
  if (!errors || typeof errors !== 'object') return errors;
  return Object.fromEntries(Object.entries(errors as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? translateServerMessage(v) : v]));
}

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('async_health_token');

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  } else if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  } else if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token on 401 unauthorized
      localStorage.removeItem('async_health_token');
      localStorage.removeItem('async_health_user');
    }
    throw new ApiError(translateServerMessage(data.message) || tr('Request failed'), response.status, translateFieldErrors(data.errors));
  }

  return data;
}

export const api = {
  // Auth
  registerPatient: (body: any) => request<any>('/auth/patient/register', { method: 'POST', body: JSON.stringify(body) }),
  registerDoctor: (body: any) => request<any>('/auth/doctor/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),

  // Patient Profile
  getPatientProfile: () => request<any>('/patient/profile'),
  updatePatientProfile: (body: any) => request<any>('/patient/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Allergies
  addAllergy: (body: any) => request<any>('/patient/allergies', { method: 'POST', body: JSON.stringify(body) }),
  updateAllergy: (id: string, body: any) => request<any>(`/patient/allergies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAllergy: (id: string) => request<any>(`/patient/allergies/${id}`, { method: 'DELETE' }),

  // Chronic Conditions
  addCondition: (body: any) => request<any>('/patient/conditions', { method: 'POST', body: JSON.stringify(body) }),
  updateCondition: (id: string, body: any) => request<any>(`/patient/conditions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCondition: (id: string) => request<any>(`/patient/conditions/${id}`, { method: 'DELETE' }),

  // Medications
  addProfileMedication: (body: any) => request<any>('/patient/medications', { method: 'POST', body: JSON.stringify(body) }),
  updateProfileMedication: (id: string, body: any) => request<any>(`/patient/medications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProfileMedication: (id: string) => request<any>(`/patient/medications/${id}`, { method: 'DELETE' }),

  // Medical Records
  uploadRecord: (formData: FormData) => request<any>('/records/upload', { method: 'POST', body: formData }),
  getRecords: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/records?${query}`);
  },
  getRecordById: (id: string) => request<any>(`/records/${id}`),
  deleteRecord: (id: string) => request<any>(`/records/${id}`, { method: 'DELETE' }),

  // Timeline & Summary
  getTimeline: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/timeline?${query}`);
  },
  getPatientSummary: () => request<any>('/timeline/summary'),

  // Doctor Portal
  doctorLookupPatient: (patientId: string, reason?: string) => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return request<any>(`/doctor/patient/${patientId}${query}`);
  },
  getDoctorPatientTimeline: (patientId: string) => request<any>(`/doctor/patient/${patientId}/timeline`),
  getDoctorPatientRecords: (patientId: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/doctor/patient/${patientId}/records?${query}`);
  },
  createDoctorConsultation: (patientId: string, formData: FormData | any) => {
    if (formData instanceof FormData) {
      return request<any>(`/doctor/patient/${patientId}/consultation`, { method: 'POST', body: formData });
    }
    return request<any>(`/doctor/patient/${patientId}/consultation`, { method: 'POST', body: JSON.stringify(formData) });
  },

  // Health Paths
  createHealthPath: (body: any) => request<any>('/health-paths', { method: 'POST', body: JSON.stringify(body) }),
  getHealthPaths: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/health-paths?${query}`);
  },
  updateHealthPathStatus: (id: string, status: string) => request<any>(`/health-paths/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addHealthPathNote: (id: string, note: string) => request<any>(`/health-paths/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),

  // Emergency Access
  getEmergencySnapshot: (patientId: string, reason?: string) => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return request<any>(`/emergency/${patientId}${query}`);
  },

  // Audit Activity
  getMyActivity: (limit = 50) => request<any>(`/audit/my-activity?limit=${limit}`),
  getDoctorActivity: (limit = 50) => request<any>(`/audit/doctor-activity?limit=${limit}`),

  // Patient Consent & Doctor Access Grants
  getPatientAccessGrants: () => request<any>('/access-grants/my-grants'),
  respondToAccessGrant: (id: string, decision: 'APPROVE' | 'REJECT' | 'REVOKE') =>
    request<any>(`/access-grants/${id}/respond`, { method: 'POST', body: JSON.stringify({ decision }) }),
  requestDoctorAccess: (patientId: string, reason: string) =>
    request<any>('/access-grants/request', { method: 'POST', body: JSON.stringify({ patientId, reason }) }),
  getDoctorAccessStatus: (patientId: string) =>
    request<any>(`/access-grants/status/${patientId}`),

  // Record classification (which specialists may see a record)
  getTaxonomy: () => request<any>('/meta/taxonomy'),
  updateRecordClassification: (id: string, body: { category?: string; conditions: string[]; sensitive?: boolean }) =>
    request<any>(`/records/${id}/classification`, { method: 'PATCH', body: JSON.stringify(body) }),
  confirmRecordClassification: (id: string) =>
    request<any>(`/records/${id}/classification/confirm`, { method: 'POST' }),

  // Cross-specialization access requests & time-limited consent
  createAccessRequest: (body: any) =>
    request<any>('/access-requests/create', { method: 'POST', body: JSON.stringify(body) }),
  listAccessRequests: (status?: string) =>
    request<any>(`/access-requests${status ? `?status=${status}` : ''}`),
  respondToAccessRequest: (id: string, body: any) =>
    request<any>(`/access-requests/${id}/respond`, { method: 'PATCH', body: JSON.stringify(body) }),
  cancelAccessRequest: (id: string) => request<any>(`/access-requests/${id}`, { method: 'DELETE' }),
  listConsents: () => request<any>('/consent'),
  listMyConsents: () => request<any>('/consent/mine'),
  revokeConsent: (id: string, reason?: string) =>
    request<any>(`/consent/${id}/revoke`, { method: 'DELETE', body: JSON.stringify({ reason }) }),

  // ── Full Medication Management ────────────────────────────────────────────
  listMedications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/medications?${query}`);
  },
  getMedication: (id: string) => request<any>(`/medications/${id}`),
  createMedication: (body: any) => request<any>('/medications', { method: 'POST', body: JSON.stringify(body) }),
  updateMedication: (id: string, body: any) => request<any>(`/medications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  discontinueMedication: (id: string) => request<any>(`/medications/${id}`, { method: 'DELETE' }),
  logDose: (id: string, body: any) => request<any>(`/medications/${id}/dose`, { method: 'POST', body: JSON.stringify(body) }),
  getDoseLogs: (id: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/medications/${id}/dose-logs?${query}`);
  },
  getTodaySchedule: () => request<any>('/medications/schedule/today'),
  getMedicationAdherence: (id: string, days = 30) => request<any>(`/medications/${id}/adherence?days=${days}`),

  // Notifications
  listNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
};

/**
 * Opens a record's attachment. The file is fetched with the login token in a header (never in the URL)
 * and shown from a temporary in-browser blob, so the storage location is never exposed.
 */
export async function openRecordFile(recordId: string): Promise<void> {
  // Open the tab synchronously so browsers don't treat it as a blocked popup
  const popup = window.open('', '_blank');
  try {
    const token = localStorage.getItem('async_health_token');
    const res = await fetch(`${API_BASE}/records/${recordId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(translateServerMessage(data.message) || tr('Could not open this file'), res.status);
    }
    const url = URL.createObjectURL(await res.blob());
    if (popup) popup.location.href = url;
    else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (err) {
    popup?.close();
    throw err;
  }
}

/**
 * Subscribes to live notifications (server-sent events). EventSource can't send an Authorization
 * header, so this reads the stream with fetch. Returns a function that stops listening.
 */
export function subscribeToNotifications(onNotification: (n: any) => void, onOpen?: () => void): () => void {
  const controller = new AbortController();
  const token = localStorage.getItem('async_health_token');

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;
      onOpen?.();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!frame.includes('event: notification')) continue;
          const data = frame.split('\n').find((l) => l.startsWith('data: '));
          if (data) {
            try {
              onNotification(JSON.parse(data.slice(6)));
            } catch {
              /* ignore malformed frame */
            }
          }
        }
      }
    } catch {
      /* aborted or offline: the bell falls back to polling */
    }
  })();

  return () => controller.abort();
}

