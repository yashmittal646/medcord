const API_BASE = '/api';

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
    throw new ApiError(data.message || 'Request failed', response.status, data.errors);
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
  addMedication: (body: any) => request<any>('/patient/medications', { method: 'POST', body: JSON.stringify(body) }),
  updateMedication: (id: string, body: any) => request<any>(`/patient/medications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMedication: (id: string) => request<any>(`/patient/medications/${id}`, { method: 'DELETE' }),

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
};

export const getRecordFileUrl = (recordId: string): string => {
  const token = localStorage.getItem('async_health_token');
  return token ? `/api/records/${recordId}/download?token=${encodeURIComponent(token)}` : `/api/records/${recordId}/download`;
};

