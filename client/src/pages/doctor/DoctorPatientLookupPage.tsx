import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import {
  Search,
  AlertTriangle,
  Pill,
  Activity,
  ArrowRight,
  Loader2,
  Info,
  UserCheck,
} from 'lucide-react';

export const DoctorPatientLookupPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(searchParams.get('id') || '');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-lookup if id is in query params
  useEffect(() => {
    const qId = searchParams.get('id');
    if (qId) {
      setPatientId(qId);
    }
  }, [searchParams]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    if (!reason.trim()) {
      setError('Please provide a reason for accessing this patient\'s records.');
      return;
    }
    setError('');
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.doctorLookupPatient(patientId.trim(), reason.trim());
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Patient not found or access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToChart = () => {
    const pId = result?.summary?.patient?.patientId || result?.patientId || patientId;
    if (pId) {
      navigate(`/doctor/patient/${pId}`);
    }
  };

  const summary = result?.summary;
  const isAccessGranted = result?.accessGranted !== false && summary;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 border-slate-200 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          Patient Lookup & Controlled Access Portal
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access a patient's medical chart using their unique Patient ID (`PAT-XXXXXX`). Patient consent is required before accessing records.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleLookup} className="glass-card p-6 border-slate-200 bg-white space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Patient ID *
          </label>
          <input
            id="patient-id-input"
            type="text"
            required
            placeholder="e.g. PAT-A1B2C3"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value.toUpperCase())}
            className="glass-input w-full font-mono text-sm text-emerald-800 placeholder-slate-400 font-bold uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Clinical Reason for Access *
          </label>
          <textarea
            required
            rows={2}
            placeholder="e.g. Cardiology consultation, Pre-op assessment, Routine follow-up..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="glass-input w-full text-sm resize-none"
          />
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            This reason is submitted to the patient for consent and permanently logged in their audit feed.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error.includes('Role \'PATIENT\'') ? 'Authorization Role Mismatch' : error}</span>
            </div>
            {error.includes('Role \'PATIENT\'') ? (
              <div className="space-y-2">
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  Your active session is currently signed in as a <strong>Patient</strong> ({user?.name || 'Arjun Mehta'}). Patient lookup requires a verified <strong>Doctor credential</strong> (such as Dr. Priya Sharma).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/doctor/login');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch to Doctor Account (Dr. Priya Sharma)</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          id="lookup-submit-btn"
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Checking Permissions & Access...</>
          ) : (
            <><Search className="w-4 h-4" /> Request / Access Patient Chart</>
          )}
        </button>
      </form>

      {/* Result Case 1: Consent Required / Pending Approval */}
      {result && !isAccessGranted && (
        <div className="glass-card p-6 border-amber-300 bg-amber-50/60 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Patient Consent Required
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold border border-amber-300 uppercase">
                  Status: {result.status || 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                An access authorization request has been sent to{' '}
                <strong className="text-slate-900 font-bold">{result.patientName || result.patientId}</strong>.
                The patient must grant permission from their Patient Dashboard before you can view their medical history, records, and timeline.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1">
            <div className="text-slate-600 font-bold">Your Access Request Justification:</div>
            <div className="text-slate-800 italic font-mono text-[11px]">"{reason}"</div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-amber-200/80">
            <button
              onClick={handleLookup}
              className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Check Approval Status
            </button>
          </div>
        </div>
      )}

      {/* Result Case 2: Access Approved — Full Patient Chart Preview */}
      {result && isAccessGranted && summary && (
        <div className="glass-card p-6 sm:p-8 border-slate-200 bg-white space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-3">
          {/* Patient Identity Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <h2 className="text-xl font-extrabold text-slate-900">{summary.patient?.name}</h2>
                <IdentityBadge
                  id={summary.patient?.patientId}
                  type="PATIENT"
                  size="sm"
                  showLabel={false}
                />
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Access Approved
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span>
                  Blood Group:{' '}
                  <strong className="text-rose-600 font-mono font-bold text-sm">
                    {summary.patient?.bloodGroup || '—'}
                  </strong>
                </span>
                <span>
                  Gender:{' '}
                  <strong className="text-slate-800 font-semibold">{summary.patient?.gender || 'Unspecified'}</strong>
                </span>
                {summary.patient?.emergencyContact?.name && (
                  <span className="text-rose-700 font-medium">
                    Emergency: {summary.patient.emergencyContact.name} ({summary.patient.emergencyContact.phone})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={goToChart}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm"
            >
              Open Full Chart <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Critical Info Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Allergies */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Allergies ({summary.criticalInformation?.allergies?.length || 0})
              </div>
              {summary.criticalInformation?.allergies?.length > 0 ? (
                <div className="space-y-1.5">
                  {summary.criticalInformation.allergies.map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-900 font-bold">{a.substance}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          a.severity === 'LIFE_THREATENING'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No known allergies</p>
              )}
            </div>

            {/* Active Medications */}
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs mb-3">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                Active Medications ({summary.criticalInformation?.currentMedications?.length || 0})
              </div>
              {summary.criticalInformation?.currentMedications?.length > 0 ? (
                <div className="space-y-1.5">
                  {summary.criticalInformation.currentMedications.map((m: any, i: number) => (
                    <div key={i}>
                      <span className="text-xs font-bold text-slate-900">{m.medicine}</span>
                      <span className="text-[11px] text-teal-700 ml-2 font-mono font-semibold">{m.dosage}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No active medications</p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-3">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                Conditions ({summary.criticalInformation?.chronicConditions?.length || 0})
              </div>
              {summary.criticalInformation?.chronicConditions?.length > 0 ? (
                <div className="space-y-1.5">
                  {summary.criticalInformation.chronicConditions.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-900 font-bold">{c.condition}</span>
                      <span className="text-[10px] text-purple-800 font-semibold">{c.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No chronic conditions</p>
              )}
            </div>
          </div>

          {/* Statistics */}
          {summary.statistics && (
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>
                Total Records:{' '}
                <strong className="text-slate-800">{summary.statistics.totalRecords}</strong>
              </span>
              <span>•</span>
              <span>
                Prescriptions:{' '}
                <strong className="text-slate-800">{summary.statistics.countsByType?.PRESCRIPTION || 0}</strong>
              </span>
              <span>•</span>
              <span>
                Lab Reports:{' '}
                <strong className="text-slate-800">{summary.statistics.countsByType?.LAB_REPORT || 0}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
