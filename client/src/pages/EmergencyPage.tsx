import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { VoiceEmergencyTrigger } from '../components/VoiceEmergencyTrigger.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  AlertTriangle,
  Phone,
  Pill,
  HeartPulse,
  Activity,
  Printer,
  ArrowLeft,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage, getLocale } from '../context/LanguageContext.js';
import { enumLabel } from '../utils/enumLabel.js';

export const EmergencyPage: React.FC = () => {
  const { t } = useLanguage();
  const { patientId: pathPatientId } = useParams<{ patientId?: string }>();
  // Voice lookup navigates to /emergency?patientId=PAT-XXXXXX; the manual flow uses /emergency/:patientId.
  const [searchParams] = useSearchParams();
  const paramPatientId = pathPatientId || searchParams.get('patientId')?.toUpperCase() || undefined;
  const idInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  const [inputPatientId, setInputPatientId] = useState(paramPatientId || '');
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('Emergency triage / Trauma room intake');

  const fetchEmergencySnapshot = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getEmergencySnapshot(idToFetch.trim(), reason);
      setSnapshot(res.data);
    } catch (err: any) {
      console.error('Emergency access failed:', err);
      setError(err.message || t('Failed to retrieve emergency medical snapshot. Doctor credentials required.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramPatientId && isDoctor) {
      setInputPatientId(paramPatientId);
      fetchEmergencySnapshot(paramPatientId);
    }
  }, [paramPatientId, isDoctor]);

  // Hands-free HUD: focus the ID field so typing works immediately as a fallback.
  useEffect(() => {
    idInputRef.current?.focus();
  }, [isDoctor]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPatientId.trim()) {
      if (pathPatientId !== inputPatientId.trim()) {
        navigate(`/emergency/${inputPatientId.trim().toUpperCase()}`);
      } else {
        fetchEmergencySnapshot(inputPatientId.trim());
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Warning Banner */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-red-700">
                  
                  {t('Critical Care Protocol')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold">
                  
                  {t('AUDITED HUD')}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                
                {t('Emergency Medical Snapshot & Resuscitation Summary')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {snapshot && (
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />  {t('Print HUD')}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />  {t('Back')}
            </button>
          </div>
        </div>
      </div>

      {/* Lookup Bar if not doctor or no param */}
      {!snapshot && (
        <div className="max-w-2xl mx-auto my-8">
          <div className="glass-card p-6 border-slate-200/90 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('Emergency Patient Lookup')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                
                {t('Enter the patient\'s unique Emergency ID (`PAT-XXXXXX`) to access real-time critical allergies, blood group, and active medications.')}
              </p>
            </div>

            {!user ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700" />
                  
                  {t('Physician Authentication Required')}
                </div>
                <p className="text-amber-800 leading-relaxed">
                  
                  {t('To protect patient confidentiality and maintain HIPAA/GDPR auditability, emergency records are accessible only to verified medical practitioners.')}
                </p>
                <div className="pt-2 flex gap-3">
                  <Link
                    to="/doctor/login"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-lg hover:opacity-95 transition-all shadow-sm"
                  >
                    
                    {t('Doctor Log In')}
                  </Link>
                </div>
              </div>
            ) : !isDoctor ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('You are currently logged in as a Patient. Emergency override lookups require Doctor credentials.')}</span>
              </div>
            ) : (
              <>
              <VoiceEmergencyTrigger navigate={navigate} />
              <form onSubmit={handleSearch} className="space-y-3 text-left pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    
                    {t('Patient ID (e.g. PAT-123456)')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={idInputRef}
                      type="text"
                      placeholder={t('PAT-XXXXXX')}
                      value={inputPatientId}
                      onChange={(e) => setInputPatientId(e.target.value.toUpperCase())}
                      className="glass-input flex-1 font-mono uppercase tracking-wider text-sm bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <Search className="w-4 h-4" />
                      {isLoading ? t('Accessing...') : t('Override & View')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    
                    {t('Clinical Justification / Reason for Emergency Access')}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="glass-input w-full text-xs bg-white"
                    required
                  />
                </div>
              </form>
              </>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snapshot HUD Display */}
      {snapshot && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Patient Bar & Vital Blood Group */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Patient Identity */}
            <div className="md:col-span-2 glass-card p-6 border-slate-200/90 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-red-600 font-bold mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  
                  {t('IDENTIFIED PATIENT RECORD')}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{snapshot.patient.name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
                  <span className="font-mono bg-teal-50 px-2.5 py-1 rounded border border-teal-200 text-teal-800 font-bold">
                    {snapshot.patient.patientId}
                  </span>
                  <span>{t('Gender:')} <strong className="text-slate-900">{snapshot.patient.gender ? enumLabel(snapshot.patient.gender) : t('Not specified')}</strong></span>
                  {snapshot.patient.age !== undefined && (
                    <span>{t('Age:')} <strong className="text-slate-900">{t('{age} yrs', { age: snapshot.patient.age })}</strong></span>
                  )}
                  {snapshot.patient.dateOfBirth && (
                    <span>{t('DOB:')} <strong className="text-slate-900">{new Date(snapshot.patient.dateOfBirth).toLocaleDateString(getLocale())}</strong></span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{t('Accessed by Dr. {name} ({doctorId})', { name: snapshot.accessedByDoctor.name, doctorId: snapshot.accessedByDoctor.doctorId })}</span>
                <span className="font-mono">{new Date(snapshot.emergencyAccessTimestamp).toLocaleTimeString(getLocale())}</span>
              </div>
            </div>

            {/* Huge Blood Group Badge */}
            <div className="glass-card p-6 border-red-200 bg-gradient-to-br from-red-50 to-white flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-red-700 mb-1">{t('Blood Group')}</span>
              <div className="text-5xl sm:text-6xl font-black text-red-600 tracking-tight">
                {snapshot.patient.bloodGroup || 'UNKNOWN'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-mono uppercase font-semibold">
                {snapshot.patient.bloodGroup ? t('Verified Serology') : t('Unspecified blood type')}
              </span>
            </div>
          </div>

          {/* Emergency Contact */}
          {snapshot.patient.emergencyContact && (
            <div className="glass-card p-4 border-amber-200 bg-amber-50/60 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                    
                    {t('Next of Kin / Emergency Contact')}
                  </span>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {snapshot.patient.emergencyContact.name || t('Emergency Contact')}
                    {snapshot.patient.emergencyContact.relationship && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({snapshot.patient.emergencyContact.relationship})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {snapshot.patient.emergencyContact.phone && (
                <a
                  href={`tel:${snapshot.patient.emergencyContact.phone}`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t('Call {phone}', { phone: snapshot.patient.emergencyContact.phone })}
                </a>
              )}
            </div>
          )}

          {/* Critical Grid: Allergies & Medications */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Critical Allergies */}
            <div className="glass-card p-6 border-red-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  
                  {t('Known Allergies & Contraindications (')}{snapshot.criticalAllergies?.length || 0})
                </h3>
              </div>

              {snapshot.criticalAllergies && snapshot.criticalAllergies.length > 0 ? (
                <div className="space-y-2.5">
                  {snapshot.criticalAllergies.map((allergy: any, idx: number) => {
                    const isSevere = allergy.severity === 'SEVERE' || allergy.severity === 'LIFE_THREATENING';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                          isSevere
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">{allergy.substance}</div>
                          {allergy.notes && (
                            <div className="text-xs text-slate-500 mt-0.5">{allergy.notes}</div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            isSevere
                              ? 'bg-red-600 text-white border-red-500 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {enumLabel(allergy.severity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  
                  {t('No known allergies documented')}
                </div>
              )}
            </div>

            {/* Active Medications */}
            <div className="glass-card p-6 border-slate-200/90 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-700 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  
                  {t('Active Medications (')}{snapshot.currentActiveMedications?.length || 0})
                </h3>
              </div>

              {snapshot.currentActiveMedications && snapshot.currentActiveMedications.length > 0 ? (
                <div className="space-y-2.5">
                  {snapshot.currentActiveMedications.map((med: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{med.medicine}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {med.frequency} {med.startDate && t('· Started {value}', { value: new Date(med.startDate).toLocaleDateString(getLocale()) })}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                        {med.dosage}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  
                  {t('No active ongoing medications')}
                </div>
              )}
            </div>
          </div>

          {/* Chronic Conditions & Active Treatment Paths */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chronic Conditions */}
            <div className="glass-card p-6 border-slate-200/90 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                
                {t('Diagnosed Chronic Conditions (')}{snapshot.chronicConditions?.length || 0})
              </h3>
              {snapshot.chronicConditions && snapshot.chronicConditions.length > 0 ? (
                <div className="space-y-2">
                  {snapshot.chronicConditions.map((cond: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{cond.condition}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {enumLabel(cond.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  
                  {t('No chronic conditions on record')}
                </div>
              )}
            </div>

            {/* Active Treatment Paths */}
            <div className="glass-card p-6 border-slate-200/90 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                
                {t('Active Health Paths (')}{snapshot.activeTreatmentPaths?.length || 0})
              </h3>
              {snapshot.activeTreatmentPaths && snapshot.activeTreatmentPaths.length > 0 ? (
                <div className="space-y-2">
                  {snapshot.activeTreatmentPaths.map((path: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-sm font-semibold text-slate-900">{path.treatment}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t('Dr. {supervisingDoctor} · Since {value}', { supervisingDoctor: path.supervisingDoctor, value: new Date(path.startDate).toLocaleDateString(getLocale()) })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  
                  {t('No active treatment pathways')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
