import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, X, Clock, AlertCircle, Send } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { NEW_NOTIFICATION_EVENT } from '../../context/NotificationContext.js';
import { prettify, useTaxonomy } from '../common/TagPicker.js';

type Duration = '24H' | '7D' | '30D';

const describeScope = (scope: any, labels: Record<string, string>) =>
  [
    ...(scope.categories ?? []).map((c: string) => `${prettify(c)} records`),
    ...(scope.conditions ?? []).map((c: string) => labels[c] ?? prettify(c)),
    ...(scope.specializations ?? []).map((s: string) => `${prettify(s)} records`),
  ].join(', ') || 'Selected records';

const timeLeft = (iso: string) => {
  const mins = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60_000));
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  return hours < 48 ? `${hours}h left` : `${Math.floor(hours / 24)}d left`;
};

/** Shows a doctor what extra access they hold for a patient, and lets them ask for more */
export const DoctorAccessPanel: React.FC<{ patientId: string; onAccessChanged?: () => void }> = ({
  patientId,
  onAccessChanged,
}) => {
  const { showToast } = useToast();
  const taxonomy = useTaxonomy();
  const [requests, setRequests] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const labels = Object.fromEntries((taxonomy?.conditions ?? []).map((c) => [c.key, c.label]));

  const load = useCallback(async () => {
    try {
      const [reqs, cons] = await Promise.all([api.listAccessRequests('PENDING'), api.listMyConsents()]);
      setRequests(reqs.data.filter((r: any) => r.patientId === patientId));
      setGrants(cons.data.filter((g: any) => g.patientId === patientId));
    } catch {
      /* the panel is supplementary; the chart still works without it */
    }
  }, [patientId]);

  useEffect(() => {
    load();
    const onNew = () => {
      load();
      onAccessChanged?.();
    };
    window.addEventListener(NEW_NOTIFICATION_EVENT, onNew);
    return () => window.removeEventListener(NEW_NOTIFICATION_EVENT, onNew);
  }, [load, onAccessChanged]);

  const cancel = async (id: string) => {
    try {
      await api.cancelAccessRequest(id);
      showToast('Request withdrawn.', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="glass-card p-5 border-slate-200 bg-white shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Records outside your specialty
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            You see records that match your specialty. For anything else, ask the patient for time-limited access.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" /> Request more records
        </button>
      </div>

      {requests.map((r) => (
        <div key={r._id} className="flex items-center justify-between gap-3 text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span className="text-amber-900">
            <strong>Pending:</strong> {describeScope(r.scope, labels)}
          </span>
          <button onClick={() => cancel(r._id)} className="text-amber-800 font-semibold hover:underline shrink-0">
            Withdraw
          </button>
        </div>
      ))}
      {grants.map((g) => (
        <div key={g._id} className="flex items-center justify-between gap-3 text-xs bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <span className="text-emerald-900">
            <strong>Approved:</strong> {describeScope(g.scope, labels)}
          </span>
          <span className="text-emerald-800 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" /> {timeLeft(g.expiresAt)}
          </span>
        </div>
      ))}

      {open && (
        <RequestModal
          patientId={patientId}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
};

const RequestModal: React.FC<{ patientId: string; onClose: () => void; onSent: () => void }> = ({
  patientId,
  onClose,
  onSent,
}) => {
  const { showToast } = useToast();
  const taxonomy = useTaxonomy();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<Duration>('7D');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const flip = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] px-2 py-1 rounded-full border font-medium transition-colors ${
        on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
      }`}
    >
      {children}
    </button>
  );

  const nothingSelected = specializations.length + conditions.length + categories.length === 0;

  const send = async () => {
    setError(null);
    setSending(true);
    try {
      await api.createAccessRequest({
        patientId,
        scope: { specializations, conditions, categories },
        reason,
        requestedDuration: duration,
      });
      showToast('Request sent. The patient has been notified.', 'success');
      onSent();
    } catch (err: any) {
      setError(err.errors?.reason || err.errors?.scope || err.message || 'Could not send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card max-w-lg w-full p-6 border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Request access to more records</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {!taxonomy ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">By specialty</p>
              <div className="flex flex-wrap gap-1.5">
                {taxonomy.specializations.map((s) => (
                  <Chip key={s} on={specializations.includes(s)} onClick={() => flip(specializations, setSpecializations, s)}>
                    {prettify(s)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">By condition</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {taxonomy.conditions.map((c) => (
                  <Chip key={c.key} on={conditions.includes(c.key)} onClick={() => flip(conditions, setConditions, c.key)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">By document type</p>
              <div className="flex flex-wrap gap-1.5">
                {taxonomy.categories.map((c) => (
                  <Chip key={c} on={categories.includes(c)} onClick={() => flip(categories, setCategories, c)}>
                    {prettify(c)}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical reason (shown to the patient)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Reviewing renal function before adjusting ACE-inhibitor dose"
            className="w-full glass-input text-xs resize-none bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">At least 10 characters. This is saved in the audit log.</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">How long do you need it?</p>
          <div className="grid grid-cols-3 gap-2">
            {(['24H', '7D', '30D'] as Duration[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  duration === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {d === '24H' ? '24 hours' : d === '7D' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">The patient decides the final duration and can approve less.</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || nothingSelected || reason.trim().length < 10}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl disabled:opacity-40"
          >
            Send request
          </button>
        </div>
      </div>
    </div>
  );
};
