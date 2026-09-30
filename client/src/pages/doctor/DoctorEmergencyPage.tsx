import React, { useState } from 'react';
import { api } from '../../services/api.js';
import {
  AlertTriangle,
  Search,
  Pill,
  Activity,
  HeartPulse,
  Zap,
  Phone,
  Loader2,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const map: Record<string, string> = {
    LIFE_THREATENING: 'bg-rose-600 text-white animate-pulse',
    SEVERE:           'bg-rose-100 text-rose-800',
    MODERATE:         'bg-amber-100 text-amber-800',
    MILD:             'bg-yellow-50 text-yellow-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${map[severity] || 'bg-slate-100 text-slate-700'}`}>
      {enumLabel(severity)}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE:   'bg-emerald-100 text-emerald-800',
    MANAGED:  'bg-teal-100 text-teal-800',
    RESOLVED: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${map[status] || 'bg-slate-100 text-slate-700'}`}>
      {enumLabel(status)}
    </span>
  );
};

export const DoctorEmergencyPage: React.FC = () => {
  const { t, tn } = useLanguage();
  const [patientId, setPatientId]   = useState('');
  const [reason, setReason]         = useState('');
  const [snapshot, setSnapshot]     = useState<any>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    setError('');
    setSnapshot(null);
    setIsLoading(true);
    try {
      const res = await api.getEmergencySnapshot(
        patientId.trim().toUpperCase(),
        reason.trim() || 'Emergency clinical access by treating physician'
      );
      setSnapshot(res.data);
    } catch (err: any) {
      setError(err.message || t('Patient not found. Please verify the Patient ID.'));
    } finally {
      setIsLoading(false);
    }
  };

  const p = snapshot?.patient;
  const allergies   = snapshot?.criticalAllergies          || [];
  const conditions  = snapshot?.chronicConditions           || [];
  const medications = snapshot?.currentActiveMedications    || [];
  const activePaths = snapshot?.activeTreatmentPaths        || [];
  const emergency   = snapshot?.patient?.emergencyContact;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Header */}
      <div className="glass-card p-6 border-rose-200 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {t('Emergency Patient HUD')}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide">
                
                {t('Audit Logged')}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              {tn("Instantly view a patient's critical medical data — allergies, conditions, medications and active treatment plans — using their Patient ID. {audit} No patient approval required.", { audit: <strong className="text-rose-700">{t("Every lookup is permanently logged in the patient's audit feed.")}</strong> })}
            </p>
          </div>
        </div>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="glass-card p-6 border-slate-200 bg-white shadow-sm space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Patient ID *')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="emergency-hud-patient-id"
                type="text"
                required
                placeholder={t('PAT-XXXXXX')}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                className="glass-input w-full font-mono text-sm text-rose-800 font-bold uppercase"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Clinical Reason (optional)')}
            </label>
            <input
              type="text"
              placeholder={t('e.g. Pre-op review, cardiac arrest response...')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass-input w-full text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />  {t('Loading Emergency Snapshot...')}</>
          ) : (
            <><Zap className="w-4 h-4" />  {t('Access Emergency Snapshot')}</>
          )}
        </button>
      </form>

      {/* Snapshot Result */}
      {snapshot && (
        <div className="space-y-5 animate-[pageEnter_0.3s_ease-out]">

          {/* Patient Identity Banner */}
          <div className="glass-card p-6 border-rose-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-400 p-0.5 shrink-0">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-2xl text-rose-600">
                    {p?.name?.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl font-extrabold text-slate-900">{p?.name}</h2>
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      {p?.patientId}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                    <span>
                      
                      {t('Blood Group:')}{' '}
                      <strong className="text-rose-600 font-mono text-base font-extrabold">
                        {p?.bloodGroup || '—'}
                      </strong>
                    </span>
                    <span>{t('Gender:')} <strong>{p?.gender ? enumLabel(p?.gender) : t('Unspecified')}</strong></span>
                    {p?.dateOfBirth && (
                      <span>
                        
                        {t('DOB:')} <strong>{new Date(p.dateOfBirth).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {emergency?.name && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <Phone className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mb-0.5">{t('Emergency Contact')}</div>
                    <div className="text-sm font-bold text-slate-900">{emergency.name}</div>
                    <div className="text-xs text-slate-600">{emergency.relationship}</div>
                    <a href={`tel:${emergency.phone}`} className="text-sm font-bold text-rose-700 hover:underline">{emergency.phone}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Critical Grid */}
          <div className="grid md:grid-cols-3 gap-5">

            {/* Allergies */}
            <div className="glass-card p-5 border-rose-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-4 pb-2 border-b border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                
                {t('Allergies (')}{allergies.length})
              </div>
              {allergies.length > 0 ? (
                <div className="space-y-2">
                  {allergies.map((a: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{a.substance}</span>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      {a.notes && <p className="text-[11px] text-slate-500 leading-snug">{a.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t('No known allergies on record')}</p>
              )}
            </div>

            {/* Conditions */}
            <div className="glass-card p-5 border-purple-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-4 pb-2 border-b border-purple-100">
                <Activity className="w-4 h-4 text-purple-600" />
                
                {t('Chronic Conditions (')}{conditions.length})
              </div>
              {conditions.length > 0 ? (
                <div className="space-y-2">
                  {conditions.map((c: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{c.condition}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.notes && <p className="text-[11px] text-slate-500 leading-snug">{c.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t('No chronic conditions on record')}</p>
              )}
            </div>

            {/* Active Medications */}
            <div className="glass-card p-5 border-teal-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs mb-4 pb-2 border-b border-teal-100">
                <Pill className="w-4 h-4 text-teal-600" />
                
                {t('Active Medications (')}{medications.length})
              </div>
              {medications.length > 0 ? (
                <div className="space-y-2">
                  {medications.map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200">
                      <div className="text-xs font-bold text-slate-900">{m.medicine}</div>
                      <div className="text-[11px] font-mono text-teal-700 font-semibold">{m.dosage}</div>
                      <div className="text-[11px] text-slate-500">{m.frequency}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t('No active medications')}</p>
              )}
            </div>
          </div>

          {/* Ongoing Treatments */}
          {activePaths.length > 0 && (
            <div className="glass-card p-6 border-emerald-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-4 pb-2 border-b border-emerald-100">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                
                {t('Ongoing Treatments / Active Health Paths (')}{activePaths.length})
              </div>
              <div className="space-y-4">
                {activePaths.map((hp: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <h3 className="text-sm font-bold text-slate-900">{hp.treatment}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        
                        {t('ACTIVE')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      
                      {t('Supervising physician:')} <strong className="text-slate-700">{hp.supervisingDoctor}</strong>
                      {hp.startDate && t(' · Started {value}', { value: new Date(hp.startDate).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              {tn("This emergency lookup has been {recorded} in {name}'s audit feed with your Doctor ID, name, timestamp, and stated reason.", { recorded: <strong>{t('permanently recorded')}</strong>, name: <strong>{p?.name}</strong> })}
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
