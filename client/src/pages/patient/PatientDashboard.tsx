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
          <div className="w-10 h-10 border-2 border-[#0c8b77]/20 border-t-[#0c8b77] rounded-full animate-spin" />
          <p className="text-xs text-[#999] font-medium">{t('dash.loading')}</p>
        </div>
      </div>
    );
  }

  const patient = summary?.patient;
  const critical = summary?.criticalInformation;

  const pendingCount = grantsData?.pending?.length || 0;
  const approvedCount = grantsData?.approved?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5 page-enter">

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
              <p className="text-xs text-[#777] mt-0.5">
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

      {/* ── Hero Profile Banner (dark card) ── */}
      <div className="card-dark p-7 sm:p-9">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[#888] text-sm font-medium mb-1">
              {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {patient?.name || user?.name}
              </h1>
              <IdentityBadge id={patient?.patientId || user?.publicId || ''} type="PATIENT" size="md" showLabel={false} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-[#aaa]">
                <Droplets className="w-4 h-4 text-[#f87171]" />
                <span className="text-white font-bold">{patient?.bloodGroup || t('Unknown')}</span>
                <span className="text-[#777]">{t('dash.bloodGroup')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#aaa]">
                <User className="w-4 h-4 text-[#5eead4]" />
                <span className="text-white font-semibold">{t('gender.' + (patient?.gender || 'OTHER'), patient?.gender || 'Unspecified')}</span>
              </div>
              {patient?.emergencyContact && (
                <div className="text-[#f87171] text-xs font-medium">
                  {t('common.emergencyPrefix')} {patient.emergencyContact.name} · {patient.emergencyContact.phone}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsPermissionsOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#5eead4]" />
              {t('dash.permissions')} {approvedCount > 0 ? `(${approvedCount})` : ''}
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 bg-[#5eead4] hover:bg-[#4dd6c0] text-[#111] font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              {t('dash.uploadRecord')}
            </button>
            <button
              onClick={() => setIsAllergyOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#f87171]" />
              {t('dash.addAllergy')}
            </button>
            <button
              onClick={() => setIsMedicationOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#5eead4]" />
              {t('dash.addMedication')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Critical Information: 3-col ── */}
      <div className="grid md:grid-cols-5 gap-4">

        {/* Allergies */}
        <div className="md:col-span-2 glass-card p-6 border-l-4 border-[#be3b2f]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#fdecea] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#be3b2f]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111]">{t('dash.allergies')}</h2>
                <p className="text-[11px] text-[#999]">{critical?.allergies?.length || 0} {t('dash.recorded')}</p>
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
                    {allergy.notes && <div className="text-[11px] text-[#888] mt-0.5">{allergy.notes}</div>}
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
            <div className="text-center py-6 text-xs text-[#bbb]">{t('dash.noAllergies')}</div>
          )}
        </div>

        {/* Active Medications */}
        <div className="md:col-span-2 glass-card p-6 border-l-4 border-[#0c8b77]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#e3f4f0] flex items-center justify-center">
                <Pill className="w-4 h-4 text-[#0c8b77]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111]">{t('dash.medications')}</h2>
                <p className="text-[11px] text-[#999]">{critical?.currentMedications?.length || 0} {t('dash.active')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMedicationOpen(true)}
              className="w-7 h-7 rounded-xl bg-[#e3f4f0] flex items-center justify-center hover:bg-[#c5ebe3] transition-colors"
              title={t('Add Medication')}
            >
              <Plus className="w-3.5 h-3.5 text-[#0c8b77]" />
            </button>
          </div>

          {critical?.currentMedications && critical.currentMedications.length > 0 ? (
            <div className="space-y-2">
              {critical.currentMedications.map((med: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-[#e3f4f0]/60 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#111]">{t('med.' + med.medicine, med.medicine)}</div>
                    <div className="text-[11px] text-[#0c8b77] mt-0.5 font-mono">{med.dosage} · {t('freq.' + med.frequency, med.frequency)}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#0c8b77] text-white shrink-0">
                    {t('status.' + (med.status || 'ACTIVE'), 'ACTIVE')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#bbb]">{t('dash.noMedications')}</div>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="md:col-span-1 glass-card p-6 border-l-4 border-[#6d3ec8]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#f1eafb] flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-[#6d3ec8]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#111] truncate">{t('dash.conditions')}</h2>
                <p className="text-[11px] text-[#999]">{critical?.chronicConditions?.length || 0} {t('dash.listed')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsConditionOpen(true)}
              className="w-7 h-7 rounded-xl bg-[#f1eafb] flex items-center justify-center hover:bg-[#e0d0f8] transition-colors shrink-0"
              title={t('Add Condition')}
            >
              <Plus className="w-3.5 h-3.5 text-[#6d3ec8]" />
            </button>
          </div>

          {critical?.chronicConditions && critical.chronicConditions.length > 0 ? (
            <div className="space-y-2">
              {critical.chronicConditions.map((cond: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f1eafb]/60">
                  <div className="text-xs font-bold text-[#111]">{t('cond.' + cond.condition, cond.condition)}</div>
                  {cond.notes && <div className="text-[11px] text-[#888] mt-0.5 line-clamp-2">{cond.notes}</div>}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#f1eafb] text-[#6d3ec8] mt-1.5 inline-block border border-[#6d3ec8]/20">
                    {t('status.' + cond.status, cond.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[11px] text-[#bbb]">{t('dash.noConditions')}</div>
          )}
        </div>
      </div>

      {/* ── Active Health Paths ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[#0c8b77]" />
              {t('dash.activeTreatmentPlans')}
            </h2>
            <p className="text-xs text-[#999] mt-0.5">{t('dash.activeTreatmentSubtitle')}</p>
          </div>
          <Link
            to="/patient/health-paths"
            className="text-xs font-bold text-[#0c8b77] hover:text-[#0a7566] flex items-center gap-1 transition-colors"
          >
            {t('dash.viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {healthPaths.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {healthPaths.map((hp) => (
              <div key={hp._id} className="p-5 rounded-2xl bg-[#e3f4f0]/50 border border-[#0c8b77]/15 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{t('cond.' + hp.condition, hp.condition)}</h3>
                    <p className="text-xs text-[#777] mt-0.5">{hp.description || t('Treatment course')}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0c8b77] text-white">
                    {t('status.' + (hp.status || 'ACTIVE'), 'ACTIVE')}
                  </span>
                </div>
                <div className="text-xs text-[#777] flex items-center gap-3 flex-wrap">
                  <span>{t('common.byLabel')} <strong className="text-[#111]">{t('Dr. {doctorName}', { doctorName: hp.doctorName })}</strong></span>
                  <span>·</span>
                  <span>{t('common.startedLabel')} {formatDate(hp.startDate, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                {hp.medications && hp.medications.length > 0 && (
                  <div className="pt-2 border-t border-[#0c8b77]/15">
                    <p className="text-[10px] uppercase tracking-wider text-[#999] font-bold mb-2">{t('common.medicinesLabel')}</p>
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
          <div className="text-center py-10 bg-[#f6f4f0] rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-[#0c8b77] mx-auto mb-2" />
            <p className="text-xs text-[#555] font-semibold">{t('dash.noTreatmentEpisodes')}</p>
            <p className="text-[11px] text-[#999] mt-0.5">{t('dash.treatmentEpisodeHint')}</p>
          </div>
        )}
      </div>

      {/* ── Recent Records & Timeline ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0c8b77]" />
              {t('dash.recentRecords')}
            </h2>
            <p className="text-xs text-[#999] mt-0.5">
              {t('dash.recentRecordsSubtitle')}
            </p>
          </div>
          <Link
            to="/patient/timeline"
            className="text-xs font-bold text-[#0c8b77] hover:text-[#0a7566] flex items-center gap-1 transition-colors"
          >
            {t('dash.viewAllRecords')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary?.recentRecords && summary.recentRecords.length > 0 ? (
          <div className="space-y-2.5">
            {summary.recentRecords.map((rec: any) => (
              <div
                key={rec._id}
                className="p-4 rounded-2xl bg-[#f6f4f0] hover:bg-[#f0ede7] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e3f4f0] text-[#0c8b77] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111]">{rec.title}</h4>
                    <div className="text-[11px] text-[#999] flex items-center gap-2 mt-0.5">
                      <span className="text-[#0c8b77] font-mono text-[10px] uppercase font-bold">
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
                    className="text-xs font-bold text-[#0c8b77] hover:text-[#0a7566] px-3 py-1.5 bg-white rounded-xl border border-[#0c8b77]/25 hover:border-[#0c8b77]/50 shadow-sm transition-all"
                  >
                    {t('common.viewFile')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-[#bbb]">
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
          <div className="w-10 h-10 rounded-2xl bg-[#e3f4f0] flex items-center justify-center group-hover:bg-[#0c8b77] transition-colors">
            <Pill className="w-5 h-5 text-[#0c8b77] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.addMedication')}</p>
        </button>
        <button onClick={() => setIsConditionOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#f1eafb] flex items-center justify-center group-hover:bg-[#6d3ec8] transition-colors">
            <Activity className="w-5 h-5 text-[#6d3ec8] group-hover:text-white transition-colors" />
          </div>
          <p className="text-xs font-bold text-[#111]">{t('dash.addCondition')}</p>
        </button>
        <button onClick={() => setIsUploadOpen(true)} className="action-tile group">
          <div className="w-10 h-10 rounded-2xl bg-[#e3f4f0] flex items-center justify-center group-hover:bg-[#0c8b77] transition-colors">
            <UploadCloud className="w-5 h-5 text-[#0c8b77] group-hover:text-white transition-colors" />
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
