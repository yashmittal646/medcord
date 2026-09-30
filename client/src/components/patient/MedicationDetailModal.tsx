import React, { useEffect, useState } from 'react';
import { X, Pill, Clock, Edit2 } from 'lucide-react';
import { api } from '../../services/api.js';

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
  status: string;
}

interface DoseLog {
  _id: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'TAKEN' | 'SKIPPED' | 'MISSED' | 'SNOOZED';
  takenAt?: string;
  notes?: string;
}

interface AdherenceStats {
  days: number;
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  snoozed: number;
  adherencePercent: number | null;
}

interface Props {
  medication: Medication;
  onClose: () => void;
  onEdit: () => void;
}

const STATUS_LABELS: Record<string, { color: string; bg: string }> = {
  TAKEN:   { color: '#1f4e8c', bg: '#e9eff8' },
  SKIPPED: { color: '#c86a0a', bg: '#fdf0e0' },
  MISSED:  { color: '#be3b2f', bg: '#fdecea' },
  SNOOZED: { color: '#3a4556', bg: '#eef1f5' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(isoDate: string) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const MedicationDetailModal: React.FC<Props> = ({ medication, onClose, onEdit }) => {
  const [tab, setTab] = useState<'details' | 'history' | 'adherence'>('details');
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [adherence, setAdherence] = useState<AdherenceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adherenceDays, setAdherenceDays] = useState(30);

  // Fetch dose logs and adherence when those tabs are opened
  useEffect(() => {
    if (tab === 'history' && logs.length === 0) {
      setIsLoading(true);
      api.getDoseLogs(medication._id)
        .then((res) => setLogs(res.data ?? []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [tab, medication._id]);

  useEffect(() => {
    if (tab === 'adherence') {
      setIsLoading(true);
      api.getMedicationAdherence(medication._id, adherenceDays)
        .then((res) => setAdherence(res.data ?? null))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [tab, medication._id, adherenceDays]);

  const statusS = {
    ACTIVE:       'bg-[#1f4e8c] text-white',
    PAUSED:       'bg-[#fdf0e0] text-[#c86a0a]',
    DISCONTINUED: 'bg-[#fdecea] text-[#be3b2f]',
    COMPLETED:    'bg-[#eef1f5] text-[#3a4556]',
  }[medication.status] ?? 'bg-[#f5f6f8] text-[#555]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="glass-card max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-[#eceff3] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#e9eff8] flex items-center justify-center shrink-0">
                <Pill className="w-4.5 h-4.5 text-[#1f4e8c]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#111] truncate">{medication.name}</h3>
                {medication.genericName && (
                  <p className="text-xs text-slate-500 italic truncate">{medication.genericName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusS}`}>
                {medication.status}
              </span>
              {medication.status !== 'DISCONTINUED' && (
                <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-[#1f4e8c] hover:bg-[#e9eff8] rounded-lg transition-colors" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-[#111] hover:bg-[#eceff3] rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mt-4 bg-[#f5f6f8] rounded-xl p-1">
            {(['details', 'history', 'adherence'] as const).map((t) => (
              <button
                key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  tab === t ? 'bg-white text-[#111] shadow-sm' : 'text-slate-500 hover:text-[#111]'
                }`}
              >
                {t === 'details' ? 'Details' : t === 'history' ? 'Dose History' : 'Adherence'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* ── Details Tab ── */}
          {tab === 'details' && (
            <div className="space-y-4">
              <InfoGrid items={[
                { label: 'Dosage', value: `${medication.dosage}${medication.unit ? ' ' + medication.unit : ''}` },
                { label: 'Frequency', value: medication.frequency },
                { label: 'Route', value: medication.route?.replace('_', ' ') || '—' },
                { label: 'Timing', value: medication.timing?.replace(/_/g, ' ') || '—' },
                { label: 'Start Date', value: formatDate(medication.startDate) },
                { label: 'End Date', value: medication.endDate ? formatDate(medication.endDate) : 'Ongoing' },
                { label: 'Prescribing Doctor', value: medication.prescribingDoctor ? `Dr. ${medication.prescribingDoctor}` : '—' },
                { label: 'Purpose', value: medication.purpose || '—' },
              ]} />
              {medication.scheduleTimes && medication.scheduleTimes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Daily Schedule</p>
                  <div className="flex flex-wrap gap-2">
                    {medication.scheduleTimes.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e9eff8] text-[#1f4e8c] text-xs font-mono font-bold rounded-lg">
                        <Clock className="w-3 h-3" />
                        {formatTime(t)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {medication.instructions && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Instructions</p>
                  <p className="text-xs text-[#555] bg-[#f5f6f8] rounded-xl p-3 leading-relaxed">{medication.instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1f4e8c]/20 border-t-[#1f4e8c] rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No dose history yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Use the schedule to log doses</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const s = STATUS_LABELS[log.status];
                    return (
                      <div key={log._id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f6f2]">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: s?.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#111]">
                            {formatDate(log.scheduledDate.split('T')[0])} · {formatTime(log.scheduledTime)}
                          </p>
                          {log.notes && <p className="text-[11px] text-slate-500 truncate">{log.notes}</p>}
                        </div>
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{ color: s?.color, background: s?.bg }}
                        >
                          {log.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Adherence Tab ── */}
          {tab === 'adherence' && (
            <div className="space-y-4">
              {/* Day selector */}
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#555] font-semibold">View last:</p>
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAdherenceDays(d)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      adherenceDays === d
                        ? 'bg-[#1f4e8c] text-white'
                        : 'bg-[#eceff3] text-slate-500 hover:bg-[#e5e0d8]'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1f4e8c]/20 border-t-[#1f4e8c] rounded-full animate-spin" />
                </div>
              ) : !adherence ? (
                <p className="text-center text-xs text-slate-500 py-12">No data yet</p>
              ) : (
                <>
                  {/* Donut-style percentage */}
                  <div className="flex flex-col items-center gap-1 py-4">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#eceff3" strokeWidth="12" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke={adherence.adherencePercent !== null && adherence.adherencePercent >= 80 ? '#1f4e8c' : '#c86a0a'}
                          strokeWidth="12"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (adherence.adherencePercent ?? 0) / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-[#111]">
                          {adherence.adherencePercent ?? '—'}
                          {adherence.adherencePercent !== null && <span className="text-sm font-bold">%</span>}
                        </span>
                        <span className="text-[10px] text-slate-500">adherence</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Taken', value: adherence.taken, color: '#1f4e8c', bg: '#e9eff8' },
                      { label: 'Skipped', value: adherence.skipped, color: '#c86a0a', bg: '#fdf0e0' },
                      { label: 'Missed', value: adherence.missed, color: '#be3b2f', bg: '#fdecea' },
                      { label: 'Snoozed', value: adherence.snoozed, color: '#3a4556', bg: '#eef1f5' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                        <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
                        <p className="text-[11px] font-semibold" style={{ color, opacity: 0.7 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-center text-slate-500">
                    Based on {adherence.total} logged dose{adherence.total !== 1 ? 's' : ''} over {adherence.days} days
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="p-3 rounded-xl bg-[#f8f6f2]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
          <p className="text-xs font-semibold text-[#333] leading-snug">{value}</p>
        </div>
      ))}
    </div>
  );
}
