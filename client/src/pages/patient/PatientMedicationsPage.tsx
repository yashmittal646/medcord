import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import {
  Pill, Plus, Clock, CheckCircle, XCircle, Pause,
  Edit2, Trash2, AlertCircle, Loader2,
  CalendarDays, RefreshCw, X, Check, SkipForward,
  ArrowRight,
} from 'lucide-react';
import { MedicationFormModal } from '../../components/patient/MedicationFormModal.js';
import { MedicationDetailModal } from '../../components/patient/MedicationDetailModal.js';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Medication {
  _id: string;
  name: string;
  genericName?: string;
  dosage: string;
  unit?: string;
  frequency: string;
  timesPerDay?: number;
  scheduleTimes?: string[];
  route?: string;
  timing?: string;
  startDate: string;
  endDate?: string;
  purpose?: string;
  prescribingDoctor?: string;
  instructions?: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISCONTINUED' | 'COMPLETED';
}

interface ScheduleEntry {
  medicationId: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  log: { status: string; takenAt?: string } | null;
}

// ── Status styling ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  ACTIVE:       { pill: 'bg-[#1f4e8c] text-white',          dot: 'bg-[#1f4e8c]',  label: 'Active' },
  PAUSED:       { pill: 'bg-[#c86a0a]/15 text-[#c86a0a] border border-[#c86a0a]/30', dot: 'bg-[#c86a0a]', label: 'Paused' },
  DISCONTINUED: { pill: 'bg-[#be3b2f]/10 text-[#be3b2f] border border-[#be3b2f]/25', dot: 'bg-[#be3b2f]', label: 'Discontinued' },
  COMPLETED:    { pill: 'bg-[#3a4556]/10 text-[#3a4556] border border-[#3a4556]/25', dot: 'bg-[#3a4556]', label: 'Completed' },
};

const DOSE_STYLES: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  TAKEN:   { bg: 'bg-[#e9eff8] text-[#1f4e8c]', icon: <Check className="w-3.5 h-3.5" />, label: 'Taken' },
  SKIPPED: { bg: 'bg-[#fdf0e0] text-[#c86a0a]', icon: <SkipForward className="w-3.5 h-3.5" />, label: 'Skipped' },
  MISSED:  { bg: 'bg-[#fdecea] text-[#be3b2f]', icon: <X className="w-3.5 h-3.5" />, label: 'Missed' },
  SNOOZED: { bg: 'bg-[#eef1f5] text-[#3a4556]', icon: <Clock className="w-3.5 h-3.5" />, label: 'Snoozed' },
};

const STATUS_TABS = [
  { id: 'ALL',          label: 'All' },
  { id: 'ACTIVE',       label: 'Active' },
  { id: 'PAUSED',       label: 'Paused' },
  { id: 'DISCONTINUED', label: 'Discontinued' },
  { id: 'COMPLETED',    label: 'Completed' },
];

// ── Page component ────────────────────────────────────────────────────────────
export const PatientMedicationsPage: React.FC = () => {
  const { formatDate } = useLanguage();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [detailMed, setDetailMed] = useState<Medication | null>(null);

  // Inline dose action feedback
  const [doseLogging, setDoseLogging] = useState<string | null>(null); // "medId::time"

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      const res = await api.listMedications(params);
      setMedications(res.medications ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  const fetchSchedule = useCallback(async () => {
    try {
      setIsScheduleLoading(true);
      const res = await api.getTodaySchedule();
      setSchedule(res.data?.schedule ?? []);
      setScheduleDate(res.data?.date ?? '');
    } catch {
      // schedule fetch is non-critical
    } finally {
      setIsScheduleLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedications(); }, [fetchMedications]);
  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  // ── Dose logging ───────────────────────────────────────────────────────────
  const handleLogDose = async (
    medId: string,
    scheduledTime: string,
    status: 'TAKEN' | 'SKIPPED' | 'SNOOZED' | 'MISSED'
  ) => {
    const key = `${medId}::${scheduledTime}`;
    setDoseLogging(key);
    try {
      await api.logDose(medId, {
        status,
        scheduledDate: scheduleDate,
        scheduledTime,
      });
      await fetchSchedule();
    } catch (err: any) {
      // silently ignore – UI stays in current state
    } finally {
      setDoseLogging(null);
    }
  };

  // ── Discontinue ────────────────────────────────────────────────────────────
  const handleDiscontinue = async (med: Medication) => {
    if (!window.confirm(`Discontinue "${med.name}"? This will preserve the full medication history.`)) return;
    try {
      await api.discontinueMedication(med._id);
      await fetchMedications();
      await fetchSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to discontinue medication');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const counts = {
    ACTIVE:       medications.filter((m) => m.status === 'ACTIVE').length,
    PAUSED:       medications.filter((m) => m.status === 'PAUSED').length,
    DISCONTINUED: medications.filter((m) => m.status === 'DISCONTINUED').length,
    COMPLETED:    medications.filter((m) => m.status === 'COMPLETED').length,
  };

  const todayTaken = schedule.filter((s) => s.log?.status === 'TAKEN').length;
  const todayTotal = schedule.length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2.5">
            <Pill className="w-6 h-6 text-[#1f4e8c]" />
            Medications
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track, manage and schedule your medications</p>
        </div>
        <button
          onClick={() => { setEditingMed(null); setIsFormOpen(true); }}
          className="px-4 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-[#1f4e8c]/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Active', count: counts.ACTIVE, color: '#1f4e8c', bg: '#e9eff8', Icon: Pill },
          { label: 'Paused', count: counts.PAUSED, color: '#c86a0a', bg: '#fdf0e0', Icon: Pause },
          { label: 'Discontinued', count: counts.DISCONTINUED, color: '#be3b2f', bg: '#fdecea', Icon: XCircle },
          { label: 'Completed', count: counts.COMPLETED, color: '#3a4556', bg: '#eef1f5', Icon: CheckCircle },
        ] as const).map(({ label, count, color, bg, Icon }) => (
          <div
            key={label}
            className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab(label.toUpperCase() as any)}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#111]" style={{ color }}>{count}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Schedule ──────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1f4e8c]" />
              Today's Schedule
              {scheduleDate && (
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  — {formatDate(new Date(scheduleDate + 'T12:00:00'), { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              )}
            </h2>
            {todayTotal > 0 && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {todayTaken} of {todayTotal} doses logged
              </p>
            )}
          </div>
          <button
            onClick={fetchSchedule}
            disabled={isScheduleLoading}
            className="p-1.5 rounded-lg hover:bg-[#eceff3] text-slate-500 hover:text-[#1f4e8c] transition-colors"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScheduleLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isScheduleLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#1f4e8c]" />
          </div>
        ) : schedule.length === 0 ? (
          <div className="text-center py-8 bg-[#f5f6f8] rounded-2xl">
            <CalendarDays className="w-7 h-7 text-[#ccc] mx-auto mb-2" />
            <p className="text-xs text-slate-500">No active medications with a schedule</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Add a medication and set schedule times to see your daily plan</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {schedule.map((entry) => {
              const doseKey = `${entry.medicationId}::${entry.scheduledTime}`;
              const isLogging = doseLogging === doseKey;
              const log = entry.log;
              const doseStyle = log ? DOSE_STYLES[log.status] : null;

              return (
                <div
                  key={doseKey}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f6f2] border border-transparent hover:border-[#1f4e8c]/15 transition-colors"
                >
                  {/* Time */}
                  <div className="text-xs font-mono font-bold text-[#1f4e8c] w-12 shrink-0">
                    {formatTime(entry.scheduledTime)}
                  </div>

                  {/* Med info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#111] truncate">{entry.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{entry.dosage}</p>
                  </div>

                  {/* Status or action buttons */}
                  {log ? (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${doseStyle?.bg}`}>
                      {doseStyle?.icon}
                      {doseStyle?.label}
                    </div>
                  ) : isLogging ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1f4e8c]" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLogDose(entry.medicationId, entry.scheduledTime, 'TAKEN')}
                        className="px-3 py-1.5 bg-[#1f4e8c] text-white text-[11px] font-bold rounded-lg hover:bg-[#183f72] transition-colors"
                      >
                        Taken
                      </button>
                      <button
                        onClick={() => handleLogDose(entry.medicationId, entry.scheduledTime, 'SKIPPED')}
                        className="px-3 py-1.5 bg-white text-[#c86a0a] border border-[#c86a0a]/30 text-[11px] font-bold rounded-lg hover:bg-[#fdf0e0] transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Medication List ────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-7">
        {/* Tab bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-[#eceff3] rounded-xl p-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#111] shadow-sm'
                    : 'text-slate-500 hover:text-[#111]'
                }`}
              >
                {tab.label}
                {tab.id !== 'ALL' && counts[tab.id as keyof typeof counts] > 0 && (
                  <span className={`ml-1.5 text-[10px] font-extrabold ${activeTab === tab.id ? 'text-[#1f4e8c]' : 'text-slate-500'}`}>
                    {counts[tab.id as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-4 rounded-xl bg-[#fdecea] text-[#be3b2f] text-xs border border-[#be3b2f]/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchMedications} className="ml-auto font-bold hover:underline">Retry</button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#1f4e8c]/20 border-t-[#1f4e8c] rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading medications…</p>
          </div>
        ) : medications.length === 0 ? (
          <EmptyState tab={activeTab} onAdd={() => { setEditingMed(null); setIsFormOpen(true); }} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <MedicationCard
                key={med._id}
                med={med}
                onEdit={() => { setEditingMed(med); setIsFormOpen(true); }}
                onDetail={() => setDetailMed(med)}
                onDiscontinue={() => handleDiscontinue(med)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <MedicationFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingMed(null); }}
        onSuccess={() => { fetchMedications(); fetchSchedule(); }}
        existingMedication={editingMed}
      />
      {detailMed && (
        <MedicationDetailModal
          medication={detailMed}
          onClose={() => setDetailMed(null)}
          onEdit={() => { setEditingMed(detailMed); setDetailMed(null); setIsFormOpen(true); }}
        />
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MedicationCard({
  med,
  onEdit,
  onDetail,
  onDiscontinue,
}: {
  med: Medication;
  onEdit: () => void;
  onDetail: () => void;
  onDiscontinue: () => void;
}) {
  const s = STATUS_STYLES[med.status];

  return (
    <div className="glass-card-hover p-5 space-y-3 border border-[#eceff3] group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
            <h3 className="text-sm font-bold text-[#111] truncate">{med.name}</h3>
            {med.genericName && (
              <span className="text-[11px] text-slate-500 italic truncate">{med.genericName}</span>
            )}
          </div>
          {med.purpose && (
            <p className="text-[11px] text-slate-500 mt-0.5 ml-4 truncate">{med.purpose}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${s.pill}`}>
          {s.label}
        </span>
      </div>

      {/* Dosing info */}
      <div className="flex flex-wrap gap-2 ml-4">
        <span className="text-[11px] font-mono font-bold text-[#1f4e8c] bg-[#e9eff8] px-2 py-0.5 rounded-lg">
          {med.dosage}
        </span>
        <span className="text-[11px] text-[#666] bg-[#f5f6f8] px-2 py-0.5 rounded-lg">
          {med.frequency}
        </span>
        {med.route && (
          <span className="text-[11px] text-slate-500 bg-[#f5f6f8] px-2 py-0.5 rounded-lg">
            {med.route.charAt(0) + med.route.slice(1).toLowerCase()}
          </span>
        )}
        {med.timing && (
          <span className="text-[11px] text-slate-500 bg-[#f5f6f8] px-2 py-0.5 rounded-lg">
            {med.timing.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 ml-4 text-[11px] text-slate-500">
        <span>
          Started:{' '}
          <strong className="text-[#555] font-semibold">
            {new Date(med.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </strong>
        </span>
        {med.endDate && (
          <span>
            Until:{' '}
            <strong className="text-[#555] font-semibold">
              {new Date(med.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </strong>
          </span>
        )}
      </div>

      {med.prescribingDoctor && (
        <p className="text-[11px] text-slate-500 ml-4">
          Prescribed by <strong className="text-[#555] font-semibold">Dr. {med.prescribingDoctor}</strong>
        </p>
      )}

      {med.scheduleTimes && med.scheduleTimes.length > 0 && (
        <div className="flex items-center gap-1.5 ml-4 flex-wrap">
          <Clock className="w-3 h-3 text-[#1f4e8c]" />
          {med.scheduleTimes.map((t) => (
            <span key={t} className="text-[10px] font-mono text-[#1f4e8c] bg-[#e9eff8] px-2 py-0.5 rounded">
              {formatTime(t)}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#eceff3]">
        <button
          onClick={onDetail}
          className="text-[11px] font-bold text-[#1f4e8c] hover:text-[#183f72] flex items-center gap-1 transition-colors"
        >
          Details & History <ArrowRight className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-1">
          {med.status !== 'DISCONTINUED' && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 text-slate-500 hover:text-[#1f4e8c] hover:bg-[#e9eff8] rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDiscontinue}
                className="p-1.5 text-slate-500 hover:text-[#be3b2f] hover:bg-[#fdecea] rounded-lg transition-colors"
                title="Discontinue"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab, onAdd }: { tab: string; onAdd: () => void }) {
  const messages: Record<string, { title: string; sub: string }> = {
    ALL:          { title: 'No medications yet', sub: 'Add your first medication to start tracking' },
    ACTIVE:       { title: 'No active medications', sub: 'Active medications will appear here' },
    PAUSED:       { title: 'No paused medications', sub: 'Paused medications will appear here' },
    DISCONTINUED: { title: 'No discontinued medications', sub: 'Your medication history will appear here' },
    COMPLETED:    { title: 'No completed medications', sub: 'Completed courses will appear here' },
  };
  const msg = messages[tab] || messages['ALL'];

  return (
    <div className="text-center py-14 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-[#e9eff8] flex items-center justify-center mx-auto">
        <Pill className="w-7 h-7 text-[#1f4e8c]" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#555]">{msg.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{msg.sub}</p>
      </div>
      {tab === 'ALL' && (
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-[#1f4e8c] text-white text-xs font-bold rounded-xl hover:bg-[#183f72] transition-colors"
        >
          Add First Medication
        </button>
      )}
    </div>
  );
}

// Format "08:00" → "8:00 AM"
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
