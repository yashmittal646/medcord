import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  UserCheck,
  XCircle,
  AlertCircle,
  Eye,
  History,
  Stethoscope,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { NEW_NOTIFICATION_EVENT } from '../../context/NotificationContext.js';
import { prettify, useTaxonomy } from '../../components/common/TagPicker.js';

type Duration = '24H' | '7D' | '30D';
const DURATIONS: { value: Duration; label: string; ms: number }[] = [
  { value: '24H', label: '24 hours', ms: 24 * 3600_000 },
  { value: '7D', label: '7 days', ms: 7 * 24 * 3600_000 },
  { value: '30D', label: '30 days', ms: 30 * 24 * 3600_000 },
];

const timeLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ${mins % 60}m left`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
};

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

interface ScopeChip {
  key: string;
  label: string;
  group: 'recordIds' | 'categories' | 'conditions' | 'specializations';
  value: string;
}

export const PatientPrivacyPage: React.FC = () => {
  const { showToast } = useToast();
  const taxonomy = useTaxonomy();
  const [requests, setRequests] = useState<any[]>([]);
  const [consents, setConsents] = useState<{ active: any[]; history: any[] }>({ active: [], history: [] });
  const [connections, setConnections] = useState<any[]>([]);
  const [recordTitles, setRecordTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [reqRes, consentRes, grantRes, recRes] = await Promise.all([
        api.listAccessRequests(),
        api.listConsents(),
        api.getPatientAccessGrants(),
        api.getRecords({ limit: 100 }),
      ]);
      setRequests(reqRes.data);
      setConsents(consentRes.data);
      setConnections(grantRes.data.pending ?? []);
      setRecordTitles(Object.fromEntries((recRes.data ?? []).map((r: any) => [r._id, r.title])));
    } catch (err: any) {
      showToast(err.message || 'Could not load your privacy settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
    // New requests arrive live; keep the countdowns ticking
    const onNew = () => load();
    window.addEventListener(NEW_NOTIFICATION_EVENT, onNew);
    const tick = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      window.removeEventListener(NEW_NOTIFICATION_EVENT, onNew);
      clearInterval(tick);
    };
  }, [load]);

  const conditionLabel = useMemo(
    () => Object.fromEntries((taxonomy?.conditions ?? []).map((c) => [c.key, c.label])),
    [taxonomy]
  );

  const chipsFor = (scope: any): ScopeChip[] => [
    ...(scope.recordIds ?? []).map((id: string) => ({
      key: `r-${id}`, group: 'recordIds' as const, value: id, label: recordTitles[id] ?? 'A record',
    })),
    ...(scope.categories ?? []).map((c: string) => ({
      key: `c-${c}`, group: 'categories' as const, value: c, label: `All ${prettify(c)} records`,
    })),
    ...(scope.conditions ?? []).map((c: string) => ({
      key: `d-${c}`, group: 'conditions' as const, value: c, label: conditionLabel[c] ?? prettify(c),
    })),
    ...(scope.specializations ?? []).map((s: string) => ({
      key: `s-${s}`, group: 'specializations' as const, value: s, label: `${prettify(s)} records`,
    })),
  ];

  const ScopeChips: React.FC<{ scope: any }> = ({ scope }) => (
    <div className="flex flex-wrap gap-1.5">
      {chipsFor(scope).map((c) => (
        <span key={c.key} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
          {c.label}
        </span>
      ))}
    </div>
  );

  const pending = requests.filter((r) => r.status === 'PENDING');
  const pastRequests = requests.filter((r) => r.status !== 'PENDING' && r.status !== 'APPROVED');

  const decline = async (id: string) => {
    try {
      await api.respondToAccessRequest(id, { decision: 'REJECT' });
      showToast('Request declined.', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const revoke = async (grantId: string) => {
    try {
      await api.revokeConsent(grantId);
      showToast('Access revoked. The doctor can no longer open these records.', 'success');
      setRevoking(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const respondConnection = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      await api.respondToAccessGrant(id, decision);
      showToast(decision === 'APPROVE' ? 'Doctor connected.' : 'Connection declined.', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="glass-card p-6 border-slate-200/90">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          Privacy &amp; Access
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Doctors you connect with see records that match their specialty. Anything beyond that needs your approval,
          for a time you choose, and you can take it back at any moment.
        </p>
      </div>

      {/* Connection requests */}
      {connections.length > 0 && (
        <section className="glass-card p-5 border-amber-200 bg-amber-50/40 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" /> Doctors asking to connect ({connections.length})
          </h2>
          {connections.map((c) => (
            <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{c.doctorName}</p>
                <p className="text-xs text-slate-500">{prettify(c.doctorSpecialization ?? '')} · {c.doctorHospital}</p>
                <p className="text-xs text-slate-600 mt-1">“{c.reason}”</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => respondConnection(c._id, 'REJECT')} className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Decline
                </button>
                <button onClick={() => respondConnection(c._id, 'APPROVE')} className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Pending record requests */}
      <section className="glass-card p-5 border-slate-200/90 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-teal-600" /> Waiting for your decision ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-xs text-slate-400">No requests right now.</p>}
        {pending.map((r) => (
          <div key={r._id} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" /> {r.doctorName}
                </p>
                <p className="text-xs text-slate-500">{prettify(r.doctorSpecialization)} · asked {fmt(r.createdAt)}</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                Wants {DURATIONS.find((d) => d.value === r.requestedDuration)?.label}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Reason</p>
              <p className="text-xs text-slate-700">{r.reason}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Wants to see</p>
              <ScopeChips scope={r.scope} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => decline(r._id)} className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                Decline
              </button>
              <button onClick={() => setReviewing(r)} className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-md shadow-teal-500/20">
                Review &amp; approve
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Active consents */}
      <section className="glass-card p-5 border-slate-200/90 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-teal-600" /> Active access ({consents.active.length})
        </h2>
        {consents.active.length === 0 && <p className="text-xs text-slate-400">No doctor currently has extra access.</p>}
        {consents.active.map((g) => (
          <div key={g._id} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{g.doctorName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeLeft(g.expiresAt)} · until {fmt(g.expiresAt)}
                </p>
              </div>
              {revoking === g._id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">End access now?</span>
                  <button onClick={() => setRevoking(null)} className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800">Keep</button>
                  <button onClick={() => revoke(g._id)} className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700">
                    Yes, revoke
                  </button>
                </div>
              ) : (
                <button onClick={() => setRevoking(g._id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Revoke now
                </button>
              )}
            </div>
            <ScopeChips scope={g.scope} />
            <p className="text-[11px] text-slate-400">
              {g.accessCount > 0 ? `Opened ${g.accessCount} time${g.accessCount === 1 ? '' : 's'}, last ${fmt(g.lastAccessedAt)}` : 'Not opened yet'}
            </p>
          </div>
        ))}
      </section>

      {/* History */}
      <section className="glass-card p-5 border-slate-200/90 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" /> History
        </h2>
        {consents.history.length + pastRequests.length === 0 && <p className="text-xs text-slate-400">Nothing yet.</p>}
        <div className="divide-y divide-slate-100">
          {consents.history.map((g) => (
            <div key={g._id} className="py-2.5 text-xs flex flex-wrap justify-between gap-2">
              <span className="text-slate-800 font-semibold">{g.doctorName}</span>
              <span className="text-slate-500">
                {g.status === 'REVOKED' ? `Revoked ${fmt(g.revokedAt)}` : `Expired ${fmt(g.expiresAt)}`}
              </span>
            </div>
          ))}
          {pastRequests.map((r) => (
            <div key={r._id} className="py-2.5 text-xs flex flex-wrap justify-between gap-2">
              <span className="text-slate-800 font-semibold">{r.doctorName}</span>
              <span className="text-slate-500">Request {r.status.toLowerCase()} · {fmt(r.respondedAt ?? r.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      {reviewing && (
        <ApproveDialog
          request={reviewing}
          chips={chipsFor(reviewing.scope)}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

/** Approve with a required duration, optionally narrowing the request to fewer items */
const ApproveDialog: React.FC<{
  request: any;
  chips: ScopeChip[];
  onClose: () => void;
  onDone: () => void;
}> = ({ request, chips, onClose, onDone }) => {
  const { showToast } = useToast();
  const [duration, setDuration] = useState<Duration | null>(null);
  const [included, setIncluded] = useState<Set<string>>(new Set(chips.map((c) => c.key)));
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) =>
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const chosen = DURATIONS.find((d) => d.value === duration);
  const untilText = chosen ? new Date(Date.now() + chosen.ms).toLocaleString() : null;

  const approve = async () => {
    if (!duration || included.size === 0) return;
    setSaving(true);
    try {
      const narrowed: Record<string, string[]> = { recordIds: [], categories: [], conditions: [], specializations: [] };
      chips.filter((c) => included.has(c.key)).forEach((c) => narrowed[c.group].push(c.value));
      await api.respondToAccessRequest(request._id, {
        decision: 'APPROVE',
        duration,
        ...(included.size < chips.length ? { narrowedScope: narrowed } : {}),
      });
      showToast(`Access approved for ${chosen?.label}.`, 'success');
      onDone();
    } catch (err: any) {
      showToast(err.message || 'Could not approve', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card max-w-md w-full p-6 border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Approve access for {request.doctorName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">“{request.reason}”</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">What they can see (untick to leave something out)</p>
          <div className="space-y-1.5">
            {chips.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" checked={included.has(c.key)} onChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">How long? (required)</p>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  duration === d.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {untilText && included.size > 0 && (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
            {request.doctorName} will be able to view {included.size} {included.size === 1 ? 'item' : 'items'} until{' '}
            <span className="font-semibold">{untilText}</span>. You can revoke at any time.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          <button
            onClick={approve}
            disabled={!duration || included.size === 0 || saving}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 disabled:opacity-40"
          >
            Approve access
          </button>
        </div>
      </div>
    </div>
  );
};
