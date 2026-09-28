import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getRecordFileUrl } from '../../services/api.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { CreateHealthPathModal } from '../../components/doctor/CreateHealthPathModal.js';
import { DoctorConsultationModal } from '../../components/doctor/DoctorConsultationModal.js';
import { MedicalDocumentModal } from '../../components/common/MedicalDocumentModal.js';
import {
  AlertTriangle,
  Pill,
  Activity,
  Clock,
  HeartPulse,
  Plus,
  Download,
  ArrowLeft,
  User,
  Stethoscope,
  FileText,
  Filter,
} from 'lucide-react';

const getBadgeColor = (type: string) => {
  const map: Record<string, string> = {
    PRESCRIPTION: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    LAB_REPORT: 'bg-purple-50 text-purple-800 border-purple-200',
    CONSULTATION: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CHECKUP: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  return map[type] || 'bg-slate-50 text-slate-800 border-slate-200';
};

export const DoctorPatientChartPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [healthPaths, setHealthPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'timeline' | 'paths'>('overview');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('ALL');
  const [isHealthPathOpen, setIsHealthPathOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const fetchChart = async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const [profileRes, timelineRes, recordsRes, pathsRes] = await Promise.all([
        api.doctorLookupPatient(patientId, 'Viewing patient chart'),
        api.getDoctorPatientTimeline(patientId).catch(() => ({ data: [] })),
        api.getDoctorPatientRecords(patientId, { limit: 100 }).catch(() => ({ data: [] })),
        api.getHealthPaths({ patientId }).catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      setTimeline(timelineRes.data || []);
      setRecords(recordsRes.data || []);
      setHealthPaths(pathsRes.data || []);
    } catch (err) {
      console.error('Failed to load chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading patient chart...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.accessGranted === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 inline-block">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Patient Consent Required</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          You do not currently have active approved access to view this patient's medical records. Please submit an access request through the Patient Lookup portal and await patient approval.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate(`/doctor/lookup?id=${patientId}`)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Request Access in Lookup Portal
          </button>
        </div>
      </div>
    );
  }

  const summary = profile.summary || profile;
  const patient = summary.patient;
  const critical = summary.criticalInformation;

  const TABS = [
    { id: 'overview', label: 'Overview', Icon: User },
    { id: 'records',  label: `Records (${records.length})`, Icon: FileText },
    { id: 'timeline', label: `Timeline (${timeline.length})`, Icon: Clock },
    { id: 'paths',   label: `Health Paths (${healthPaths.length})`, Icon: HeartPulse },
  ] as const;

  const RECORD_TYPES = ['ALL', 'PRESCRIPTION', 'LAB_REPORT', 'CONSULTATION', 'CHECKUP', 'OTHER'];
  const filteredRecords = recordTypeFilter === 'ALL'
    ? records
    : records.filter((r) => r.recordType === recordTypeFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back + Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lookup
        </button>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={() => setIsConsultationOpen(true)}
            id="add-consultation-btn"
            className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            Add Consultation
          </button>
          <button
            onClick={() => setIsHealthPathOpen(true)}
            id="create-health-path-btn"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Health Path
          </button>
        </div>
      </div>

      {/* Patient Identity Banner */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shrink-0 shadow-sm">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-xl text-teal-600">
                {patient?.name?.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <h1 className="text-xl font-extrabold text-slate-900">{patient?.name}</h1>
                <IdentityBadge id={patient?.patientId} type="PATIENT" size="sm" showLabel={false} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span>
                  Blood Group:{' '}
                  <strong className="text-rose-600 font-mono font-bold">{patient?.bloodGroup || '—'}</strong>
                </span>
                <span>Gender: <strong className="text-slate-800 font-semibold">{patient?.gender || 'Unspecified'}</strong></span>
                {patient?.emergencyContact?.name && (
                  <span className="text-rose-700 font-medium">
                    Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-center">
            {[
              { label: 'Records', value: records.length },
              { label: 'Health Paths', value: healthPaths.length },
              { label: 'Timeline Events', value: timeline.length },
            ].map((s) => (
              <div key={s.label} className="px-3 border-l border-slate-100 first:border-0">
                <div className="text-xl font-extrabold text-slate-900">{s.value ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === id
                ? 'bg-white text-emerald-800 border border-slate-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-5">
          {/* Allergies */}
          <div className="glass-card p-6 border-rose-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-4 pb-2 border-b border-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Allergies ({critical?.allergies?.length || 0})
            </div>
            {critical?.allergies?.length > 0 ? (
              <div className="space-y-2">
                {critical.allergies.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200">
                    <span className="text-xs text-slate-900 font-bold">{a.substance}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      a.severity === 'LIFE_THREATENING'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}>{a.severity}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400">No known allergies</p>}
          </div>

          {/* Medications */}
          <div className="glass-card p-6 border-teal-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs mb-4 pb-2 border-b border-teal-100">
              <Pill className="w-4 h-4 text-teal-600" />
              Active Medications ({critical?.currentMedications?.length || 0})
            </div>
            {critical?.currentMedications?.length > 0 ? (
              <div className="space-y-2">
                {critical.currentMedications.map((m: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200">
                    <span className="text-xs font-bold text-slate-900">{m.medicine}</span>
                    <div className="text-[11px] text-teal-700 font-mono font-semibold">{m.dosage} · {m.frequency}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400">No active medications</p>}
          </div>

          {/* Conditions */}
          <div className="glass-card p-6 border-purple-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-4 pb-2 border-b border-purple-100">
              <Activity className="w-4 h-4 text-purple-600" />
              Chronic Conditions ({critical?.chronicConditions?.length || 0})
            </div>
            {critical?.chronicConditions?.length > 0 ? (
              <div className="space-y-2">
                {critical.chronicConditions.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
                    <span className="text-xs text-slate-900 font-bold">{c.condition}</span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">{c.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400">No chronic conditions</p>}
          </div>
        </div>
      )}

      {/* ── Records Tab ── */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Type filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {RECORD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setRecordTypeFilter(t)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                  recordTypeFilter === t
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((rec: any) => (
                <div key={rec._id} className="glass-card p-5 border-slate-200 bg-white shadow-xs hover:border-emerald-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeColor(rec.recordType)}`}>
                          {rec.recordType?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-semibold">
                          {new Date(rec.recordDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {rec.uploaderRole === 'DOCTOR' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">By Doctor</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{rec.title}</h3>
                      {rec.diagnosis && (
                        <div className="p-2 mb-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                          <strong>Diagnosis:</strong> {rec.diagnosis}
                        </div>
                      )}
                      {rec.description && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{rec.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                        {rec.doctorName && <span className="font-medium text-slate-600">{rec.doctorName}</span>}
                        {rec.facilityName && <><span>•</span><span>{rec.facilityName}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        title="View & Download Prescription / Document"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-bold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download / View</span>
                      </button>

                      {rec.file?.url && (
                        <a
                          href={rec.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>File</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center border-slate-200 bg-white">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No records found</p>
              <p className="text-xs text-slate-500 mt-1">No {recordTypeFilter !== 'ALL' ? recordTypeFilter.replace('_',' ').toLowerCase() : ''} records for this patient yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          {timeline.length > 0 ? (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
              {timeline.map((event: any) => (
                <div key={event.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 group-hover:bg-emerald-500 transition-all shadow-xs" />
                  <div className="glass-card p-5 border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeColor(event.recordType)}`}>
                          {event.recordType}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-semibold">
                          {new Date(event.recordDate).toLocaleDateString()}
                        </span>
                      </div>
                      {event.hasAttachment && (
                        <a
                          href={getRecordFileUrl(event.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {event.fileDetails?.originalName || 'Download File'}
                        </a>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{event.title}</h3>
                    {event.diagnosis && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                        <strong className="font-bold">Diagnosis:</strong> {event.diagnosis}
                      </div>
                    )}
                    {event.description && <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>}
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                      {event.doctorName && <span className="font-medium text-slate-600">Dr. {event.doctorName}</span>}
                      {event.facilityName && <><span>•</span><span>{event.facilityName}</span></>}
                      <span>• Recorded by: {event.uploadedBy?.name} ({event.uploadedBy?.role})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center border-slate-200 bg-white">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No timeline events yet</p>
              <p className="text-xs text-slate-500 mt-1">Add a consultation to start building this patient's history.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="space-y-4">
          {healthPaths.length > 0 ? (
            healthPaths.map((hp: any) => (
              <div key={hp._id} className="glass-card p-5 border-teal-200 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{hp.condition}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                        {hp.status}
                      </span>
                    </div>
                    {hp.description && <p className="text-xs text-slate-600 mt-0.5">{hp.description}</p>}
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Started: {new Date(hp.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {hp.medications?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {hp.medications.map((m: any, i: number) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-mono font-medium">
                          {m.medicine} ({m.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="glass-card p-12 text-center border-slate-200 bg-white">
              <HeartPulse className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No health paths created</p>
              <button
                onClick={() => setIsHealthPathOpen(true)}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Health Path
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateHealthPathModal
        isOpen={isHealthPathOpen}
        onClose={() => setIsHealthPathOpen(false)}
        onSuccess={fetchChart}
        patientId={patientId || ''}
      />
      <DoctorConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onSuccess={fetchChart}
        patientId={patientId || ''}
      />

      {/* Official Medical Prescription / Document Viewer & Download Modal */}
      <MedicalDocumentModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
