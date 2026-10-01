import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';
import { useOpenRecordFile } from '../../hooks/useOpenRecordFile.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { AllergyModal } from '../../components/patient/AllergyModal.js';
import { MedicationModal } from '../../components/patient/MedicationModal.js';
import { ConditionModal } from '../../components/patient/ConditionModal.js';
import { UploadRecordModal } from '../../components/patient/UploadRecordModal.js';
import { DoctorAccessRequestsModal } from '../../components/patient/DoctorAccessRequestsModal.js';
import { greeting } from '../../utils/greeting.js';
import { TestsToDo } from './PatientPrescriptionsPage.js';
import { enumLabel } from '../../utils/enumLabel.js';
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
  Droplets,
  User,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const openFile = useOpenRecordFile();
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
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
          <div className="w-10 h-10 border-2 border-[#1f4e8c]/20 border-t-[#1f4e8c] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">{t('dash.loading')}</p>
        </div>
      </div>
    );
  }

  const patient = summary?.patient;
  const critical = summary?.criticalInformation;

  const pendingCount = grantsData?.pending?.length || 0;
  const approvedCount = grantsData?.approved?.length || 0;
  const seriousAllergies = (critical?.allergies || []).filter((a: any) => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5 ">

      {/* ── Pending Access Request Alert ── */}
      {pendingCount > 0 && (
        <div
          className="rounded-2xl p-4 sm:p-5 border-2 border-[#c86a0a]/30 bg-[#fdf0e0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 2px 12px rgba(200,106,10,0.1)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#c86a0a]/10 border border-[#c86a0a]/20">
              <ShieldAlert className="w-5 h-5 text-[#c86a0a]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111] flex items-center gap-2">
                {t('dash.accessPendingTitle')}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c86a0a] text-white font-extrabold">
                  {pendingCount}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('{doctorName} ({doctorId}) has requested permission to view your medical chart.', { doctorName: grantsData.pending[0].doctorName, doctorId: grantsData.pending[0].doctorId })}</p>
            </div>
          </div>
          <button
            onClick={() => setIsPermissionsOpen(true)}
            className="px-4 py-2 bg-[#c86a0a] hover:bg-[#b05e09] text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            {t('dash.reviewGrant')}
          </button>
        </div>
      )}

      {/* ── Patient header ── */}
      <section className="glass-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-[var(--pr-muted)]">{greeting((patient?.name || user?.name || '').split(' ')[0])}</p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--pr-ink)]">{patient?.name || user?.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--pr-ink-2)]">
              <IdentityBadge id={patient?.patientId || user?.publicId || ''} type="PATIENT" size="sm" showLabel={false} />
              <span className="inline-flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-[var(--pr-danger)]" aria-hidden="true" />
                <strong className="font-semibold">{patient?.bloodGroup && patient.bloodGroup !== 'UNKNOWN' ? patient.bloodGroup : t('Unknown')}</strong>
                <span className="text-[var(--pr-muted)]">{t('dash.bloodGroup')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 text-[var(--pr-muted)]" aria-hidden="true" />
                {t('gender.' + (patient?.gender || 'OTHER'), patient?.gender || 'Unspecified')}
              </span>
              {patient?.emergencyContact && (
                <span className="text-[var(--pr-ink-2)]">
                  {t('common.emergencyPrefix')} {patient.emergencyContact.name} · <span className="font-mono">{patient.emergencyContact.phone}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            <button onClick={() => setIsPermissionsOpen(true)} className="pr-btn">
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t('dash.permissions')} {approvedCount > 0 ? `(${approvedCount})` : ''}
            </button>
            <button onClick={() => setIsAllergyOpen(true)} className="pr-btn">
              {t('dash.addAllergy')}
            </button>
            <button onClick={() => setIsMedicationOpen(true)} className="pr-btn">
              {t('dash.addMedication')}
            </button>
            <button onClick={() => setIsUploadOpen(true)} className="pr-btn pr-btn-primary">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {t('dash.uploadRecord')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Serious allergies stay impossible to miss ── */}
      {seriousAllergies.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg bg-[var(--pr-danger)] px-4 py-3 text-white">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-[0.9375rem] font-semibold leading-snug">
            {t('Allergy alert')}:{' '}
            {seriousAllergies
              .map((a: any) => `${t('allergy.' + a.substance, a.substance)} (${enumLabel(a.severity)})`)
              .join(', ')}
          </p>
        </div>
      )}

      {/* ── At a glance ── */}
      <div className="portal-figs">
        {[
          { to: '/patient/profile', value: critical?.allergies?.length || 0, label: t('Allergies') },
          { to: '/patient/medications', value: critical?.currentMedications?.length || 0, label: t('Medicines') },
          { to: '/patient/profile', value: critical?.chronicConditions?.length || 0, label: t('Conditions') },
          { to: '/patient/health-paths', value: healthPaths.length, label: t('Care plans') },
        ].map((f) => (
          <Link key={f.label} to={f.to} className="block transition-colors hover:bg-[var(--pr-hover)]">
            <p className="portal-fig-value">{f.value}</p>
            <p className="portal-fig-label">{f.label}</p>
          </Link>
        ))}
      </div>

      <TestsToDo compact />

      {/* ── Critical Information: 3-col ── */}
      <div className="grid md:grid-cols-5 gap-4">

        {/* Allergies */}
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#fdecea] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#be3b2f]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111]">{t('dash.allergies')}</h2>
                <p className="text-[11px] text-slate-500">{critical?.allergies?.length || 0} {t('dash.recorded')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAllergyOpen(true)}
              className="w-7 h-7 rounded-xl bg-[#fdecea] flex items-center justify-center hover:bg-[#fbd5d1] transition-colors"
              title={t('Add Allergy')}
            >
              <Plus className="w-3.5 h-3.5 text-[#be3b2f]" />
            </button>
          </div>

          {critical?.allergies && critical.allergies.length > 0 ? (
            <div className="space-y-2">
              {critical.allergies.map((allergy: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#fdecea]/60 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-[#111]">{t('allergy.' + allergy.substance, allergy.substance)}</div>
                    {allergy.notes && <div className="text-[11px] text-slate-500 mt-0.5">{allergy.notes}</div>}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      allergy.severity === 'LIFE_THREATENING'
                        ? 'bg-[#be3b2f] text-white animate-pulse'
                        : allergy.severity === 'SEVERE'
                        ? 'bg-[#fbd5d1] text-[#be3b2f]'
                        : 'bg-[#fdf0e0] text-[#c86a0a]'
                    }`}
                  >
                    {t('severity.' + allergy.severity, allergy.severity)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">{t('dash.noAllergies')}</div>
          )}
        </div>

        {/* Active Medications */}
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#e9eff8] flex items-center justify-center">
                <Pill className="w-4 h-4 text-[#1f4e8c]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111]">{t('dash.medications')}</h2>
                <p className="text-[11px] text-slate-500">{critical?.currentMedications?.length || 0} {t('dash.active')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/patient/medications"
                className="text-[11px] font-bold text-[#1f4e8c] hover:text-[#183f72] flex items-center gap-1 transition-colors"
              >
                {t('Manage')} <ArrowUpRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setIsMedicationOpen(true)}
                className="w-7 h-7 rounded-xl bg-[#e9eff8] flex items-center justify-center hover:bg-[#d6e1f1] transition-colors"
                title={t('Add Medication')}
              >
                <Plus className="w-3.5 h-3.5 text-[#1f4e8c]" />
              </button>
            </div>
          </div>

          {critical?.currentMedications && critical.currentMedications.length > 0 ? (
            <div className="space-y-2">
              {critical.currentMedications.map((med: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-[#e9eff8]/60 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#111]">{t('med.' + med.medicine, med.medicine)}</div>
                    <div className="text-[11px] text-[#1f4e8c] mt-0.5 font-mono">{med.dosage} · {t('freq.' + med.frequency, med.frequency)}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#1f4e8c] text-white shrink-0">
                    {t('status.' + (med.status || 'ACTIVE'), 'ACTIVE')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">{t('dash.noMedications')}</div>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="md:col-span-1 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#eef1f5] flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-[#3a4556]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#111] truncate">{t('dash.conditions')}</h2>
                <p className="text-[11px] text-slate-500">{critical?.chronicConditions?.length || 0} {t('dash.listed')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsConditionOpen(true)}
              className="w-7 h-7 rounded-xl bg-[#eef1f5] flex items-center justify-center hover:bg-[#e2e6ec] transition-colors shrink-0"
              title={t('Add Condition')}
            >
              <Plus className="w-3.5 h-3.5 text-[#3a4556]" />
            </button>
          </div>

          {critical?.chronicConditions && critical.chronicConditions.length > 0 ? (
            <div className="space-y-2">
              {critical.chronicConditions.map((cond: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-[#eef1f5]/60">
                  <div className="text-xs font-bold text-[#111]">{t('cond.' + cond.condition, cond.condition)}</div>
                  {cond.notes && <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{cond.notes}</div>}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#eef1f5] text-[#3a4556] mt-1.5 inline-block border border-[#3a4556]/20">
                    {t('status.' + cond.status, cond.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[11px] text-slate-500">{t('dash.noConditions')}</div>
          )}
        </div>
      </div>

      {/* ── Active Health Paths ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[#1f4e8c]" />
              {t('dash.activeTreatmentPlans')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('dash.activeTreatmentSubtitle')}</p>
          </div>
          <Link
            to="/patient/health-paths"
            className="text-xs font-bold text-[#1f4e8c] hover:text-[#183f72] flex items-center gap-1 transition-colors"
          >
            {t('dash.viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {healthPaths.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {healthPaths.map((hp) => (
              <div key={hp._id} className="p-5 rounded-2xl bg-[#e9eff8]/50 border border-[#1f4e8c]/15 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{t('cond.' + hp.condition, hp.condition)}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{hp.description || t('Treatment course')}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#1f4e8c] text-white">
                    {t('status.' + (hp.status || 'ACTIVE'), 'ACTIVE')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  <span>{t('common.byLabel')} <strong className="text-[#111]">{t('Dr. {doctorName}', { doctorName: hp.doctorName })}</strong></span>
                  <span>·</span>
                  <span>{t('common.startedLabel')} {formatDate(hp.startDate, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                {hp.medications && hp.medications.length > 0 && (
                  <div className="pt-2 border-t border-[#1f4e8c]/15">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">{t('common.medicinesLabel')}</p>
                    <div className="flex flex-wrap gap-2">
                      {hp.medications.map((m: any, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white text-[#111] border border-[#ddd] font-mono"
                        >
                          {t('med.' + m.medicine, m.medicine)} ({m.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#f5f6f8] rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-[#1f4e8c] mx-auto mb-2" />
            <p className="text-xs text-[#555] font-semibold">{t('dash.noTreatmentEpisodes')}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('dash.treatmentEpisodeHint')}</p>
          </div>
        )}
      </div>

      {/* ── Recent Records & Timeline ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1f4e8c]" />
              {t('dash.recentRecords')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('dash.recentRecordsSubtitle')}
            </p>
          </div>
          <Link
            to="/patient/timeline"
            className="text-xs font-bold text-[#1f4e8c] hover:text-[#183f72] flex items-center gap-1 transition-colors"
          >
            {t('dash.viewAllRecords')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary?.recentRecords && summary.recentRecords.length > 0 ? (
          <div className="space-y-2.5">
            {summary.recentRecords.map((rec: any) => (
              <div
                key={rec._id}
                className="p-4 rounded-2xl bg-[#f5f6f8] hover:bg-[#eceff3] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e9eff8] text-[#1f4e8c] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111]">{rec.title}</h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="text-[#1f4e8c] font-mono text-[10px] uppercase font-bold">
                        {t('recType.' + rec.recordType, rec.recordType)}
                      </span>
                      <span>·</span>
                      <span>{formatDate(rec.recordDate, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      {rec.doctorName && (
                        <>
                          <span>·</span>
                          <span className="text-[#555] font-medium">{t('Dr. {doctorName}', { doctorName: rec.doctorName })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {rec.file && (
                  <button
                    type="button"
                    onClick={() => openFile(rec._id)}
                    className="text-xs font-bold text-[#1f4e8c] hover:text-[#183f72] px-3 py-1.5 bg-white rounded-xl border border-[#1f4e8c]/25 hover:border-[#1f4e8c]/50 shadow-sm transition-all"
                  >
                    {t('common.viewFile')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500">
            {t('records.emptySubtitle')}
          </div>
        )}
      </div>

      {/* ── Quick Actions Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => setIsAllergyOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#fdecea] flex items-center justify-center group-hover:bg-[#be3b2f] transition-colors">
            <AlertTriangle className="w-5 h-5 text-[#be3b2f] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.addAllergy')}</p>
        </button>
        <button onClick={() => setIsMedicationOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#e9eff8] flex items-center justify-center group-hover:bg-[#1f4e8c] transition-colors">
            <Pill className="w-5 h-5 text-[#1f4e8c] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.addMedication')}</p>
        </button>
        <button onClick={() => setIsConditionOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#eef1f5] flex items-center justify-center group-hover:bg-[#3a4556] transition-colors">
            <Activity className="w-5 h-5 text-[#3a4556] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.addCondition')}</p>
        </button>
        <button onClick={() => setIsUploadOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#e9eff8] flex items-center justify-center group-hover:bg-[#1f4e8c] transition-colors">
            <UploadCloud className="w-5 h-5 text-[#1f4e8c] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.uploadRecord')}</p>
        </button>
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
