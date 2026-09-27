import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api, getRecordFileUrl } from '../../services/api.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { AllergyModal } from '../../components/patient/AllergyModal.js';
import { MedicationModal } from '../../components/patient/MedicationModal.js';
import { ConditionModal } from '../../components/patient/ConditionModal.js';
import { UploadRecordModal } from '../../components/patient/UploadRecordModal.js';
import { DoctorAccessRequestsModal } from '../../components/patient/DoctorAccessRequestsModal.js';
import {
  AlertTriangle,
  Pill,
  HeartPulse,
  Activity,
  UploadCloud,
  Clock,
  Plus,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [healthPaths, setHealthPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAllergyOpen, setIsAllergyOpen] = useState(false);
  const [isMedicationOpen, setIsMedicationOpen] = useState(false);
  const [isConditionOpen, setIsConditionOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [grantsData, setGrantsData] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, pathsRes, grantsRes] = await Promise.all([
        api.getPatientSummary(),
        api.getHealthPaths({ status: 'ACTIVE' }),
        api.getPatientAccessGrants().catch(() => ({ data: null })),
      ]);
      setSummary(summaryRes.data);
      setHealthPaths(pathsRes.data || []);
      setGrantsData(grantsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading patient chart...</p>
        </div>
      </div>
    );
  }

  const patient = summary?.patient;
  const critical = summary?.criticalInformation;
  const stats = summary?.statistics;

  const pendingCount = grantsData?.pending?.length || 0;
  const approvedCount = grantsData?.approved?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Pending Access Request Alert Banner */}
      {pendingCount > 0 && (
        <div className="glass-card p-4 sm:p-5 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Doctor Access Request Pending</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold">
                  {pendingCount}
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {grantsData.pending[0].doctorName} ({grantsData.pending[0].doctorId}) has requested permission to view your medical chart.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPermissionsOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            Review & Grant Permission
          </button>
        </div>
      )}

      {/* Hero Profile Banner */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 relative overflow-hidden bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-xl text-teal-600">
                {patient?.name?.charAt(0) || 'P'}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{patient?.name}</h1>
                <IdentityBadge id={patient?.patientId || user?.publicId || ''} type="PATIENT" size="md" showLabel={false} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span>Blood Group: <strong className="text-rose-600 font-mono font-bold">{patient?.bloodGroup || 'UNKNOWN'}</strong></span>
                <span>•</span>
                <span>Gender: <strong className="text-slate-800 font-semibold">{patient?.gender || 'Unspecified'}</strong></span>
                {patient?.emergencyContact && (
                  <>
                    <span>•</span>
                    <span className="text-rose-700 font-medium">
                      Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPermissionsOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doctor Permissions {approvedCount > 0 ? `(${approvedCount})` : ''}</span>
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Record</span>
            </button>
            <button
              onClick={() => setIsAllergyOpen(true)}
              className="px-3.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Allergy</span>
            </button>
            <button
              onClick={() => setIsMedicationOpen(true)}
              className="px-3.5 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Medication</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Information Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 1. Allergies */}
        <div className="glass-card p-6 border-rose-200 bg-white relative shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Allergies ({critical?.allergies?.length || 0})</span>
            </div>
            <button
              onClick={() => setIsAllergyOpen(true)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              title="Add Allergy"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {critical?.allergies && critical.allergies.length > 0 ? (
            <div className="space-y-2.5">
              {critical.allergies.map((allergy: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{allergy.substance}</div>
                    {allergy.notes && <div className="text-[11px] text-slate-500 mt-0.5">{allergy.notes}</div>}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      allergy.severity === 'LIFE_THREATENING'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : allergy.severity === 'SEVERE'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {allergy.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No known allergies recorded. Click + to add.
            </div>
          )}
        </div>

        {/* 2. Active Medications */}
        <div className="glass-card p-6 border-teal-200 bg-white relative shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-teal-100">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Active Medications ({critical?.currentMedications?.length || 0})</span>
            </div>
            <button
              onClick={() => setIsMedicationOpen(true)}
              className="p-1 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
              title="Add Medication"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {critical?.currentMedications && critical.currentMedications.length > 0 ? (
            <div className="space-y-2.5">
              {critical.currentMedications.map((med: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{med.medicine}</div>
                    <div className="text-[11px] text-teal-700 mt-0.5 font-mono">{med.dosage} • {med.frequency}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-300">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No active medications recorded.
            </div>
          )}
        </div>

        {/* 3. Chronic Conditions */}
        <div className="glass-card p-6 border-purple-200 bg-white relative shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Chronic Conditions ({critical?.chronicConditions?.length || 0})</span>
            </div>
            <button
              onClick={() => setIsConditionOpen(true)}
              className="p-1 text-slate-400 hover:text-purple-600 rounded-lg transition-colors"
              title="Add Condition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {critical?.chronicConditions && critical.chronicConditions.length > 0 ? (
            <div className="space-y-2.5">
              {critical.chronicConditions.map((cond: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{cond.condition}</div>
                    {cond.notes && <div className="text-[11px] text-slate-500 mt-0.5">{cond.notes}</div>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                    {cond.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No chronic conditions recorded.
            </div>
          )}
        </div>
      </div>

      {/* Active Health Paths Section */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-600" />
              Active Health Path Treatments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ongoing physician-directed treatment plans and active courses
            </p>
          </div>
          <Link
            to="/patient/health-paths"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>View All Paths</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {healthPaths.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {healthPaths.map((hp) => (
              <div key={hp._id} className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{hp.condition}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{hp.description || 'Treatment course'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                    ACTIVE
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-4">
                  <span>Prescribing Doctor: <strong className="text-slate-800">{hp.doctorName}</strong></span>
                  <span>•</span>
                  <span>Started: {new Date(hp.startDate).toLocaleDateString()}</span>
                </div>

                {hp.medications && hp.medications.length > 0 && (
                  <div className="pt-2 border-t border-teal-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
                      Prescribed Course Medicines:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {hp.medications.map((m: any, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-slate-200 font-mono shadow-xs"
                        >
                          {m.medicine} ({m.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <p className="text-xs text-slate-700 font-semibold">No active treatment episodes at this time.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">When a doctor creates a treatment path, it will appear here.</p>
          </div>
        )}
      </div>

      {/* Recent Records & Timeline Quick View */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Recent Medical Timeline Events
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total records: <span className="text-teal-700 font-bold">{stats?.totalRecords || 0}</span>
            </p>
          </div>
          <Link
            to="/patient/timeline"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>Open Interactive Timeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary?.recentRecords && summary.recentRecords.length > 0 ? (
          <div className="space-y-3">
            {summary.recentRecords.map((rec: any) => (
              <div
                key={rec._id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-teal-300 hover:bg-white transition-all flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="text-teal-700 font-mono text-[10px] uppercase font-bold">{rec.recordType}</span>
                      <span>•</span>
                      <span>{new Date(rec.recordDate).toLocaleDateString()}</span>
                      {rec.doctorName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 font-medium">Dr. {rec.doctorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {rec.file && (
                  <a
                    href={getRecordFileUrl(rec._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3 py-1.5 bg-white rounded-lg border border-teal-200 shadow-xs hover:shadow transition-all"
                  >
                    View File
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No medical records uploaded yet. Click "Upload Record" to begin.
          </div>
        )}
      </div>

      {/* Modals */}
      <AllergyModal isOpen={isAllergyOpen} onClose={() => setIsAllergyOpen(false)} onSuccess={fetchDashboardData} />
      <MedicationModal isOpen={isMedicationOpen} onClose={() => setIsMedicationOpen(false)} onSuccess={fetchDashboardData} />
      <ConditionModal isOpen={isConditionOpen} onClose={() => setIsConditionOpen(false)} onSuccess={fetchDashboardData} />
      <UploadRecordModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={fetchDashboardData} />
      <DoctorAccessRequestsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        onRequestHandled={fetchDashboardData}
      />
    </div>
  );
};
