import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, FilePlus2, FileText, Loader2, Pencil, Printer, Settings2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useToast } from '../../context/ToastContext.js';
import { tx } from '../../i18n/index.js';
import { PrescriptionDocument } from '../../components/prescription/PrescriptionDocument.js';
import { RxDocument, fromApi } from '../../components/prescription/rx.js';

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: tx('Draft'), cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  ISSUED: { label: tx('Issued'), cls: 'bg-[var(--pr-primary-tint)] text-[var(--pr-primary)] border-[#c7d5ea]' },
  SUPERSEDED: { label: tx('Replaced by a newer version'), cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useLanguage();
  const s = STATUS[status] ?? STATUS.DRAFT;
  return <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{t(s.label)}</span>;
};

/** Opens the print view (A4) in a new tab; the browser's dialog offers "Save as PDF" */
export const openPrint = (id: string) => window.open(`/print/prescription/${id}`, '_blank', 'noopener');

// ── List ────────────────────────────────────────────────────────────────────

export const DoctorPrescriptionsPage: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .listPrescriptions({ ...(patient ? { patientId: patient } : {}), ...(status ? { status } : {}) })
      .then((r) => setRows(r.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patient, status]);

  const patients = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.patientId, r.patientName ?? r.patientId));
    return [...m.entries()];
  }, [rows]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-7">
      <section className="glass-card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">{t('Prescriptions')}</h2>
          <p className="text-sm text-[var(--pr-muted)]">{t('Drafts, issued prescriptions and their versions, newest first.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/doctor/letterhead" className="pr-btn">
            <Settings2 className="h-4 w-4" /> {t('Letterhead')}
          </Link>
          <Link to="/doctor/prescriptions/new" className="pr-btn pr-btn-primary">
            <FilePlus2 className="h-4 w-4" /> {t('New prescription')}
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <select aria-label={t('Patient')} className="glass-input" value={patient} onChange={(e) => setPatient(e.target.value)}>
          <option value="">{t('All patients')}</option>
          {patients.map(([pid, name]) => (
            <option key={pid} value={pid}>
              {name} ({pid})
            </option>
          ))}
        </select>
        {['', 'DRAFT', 'ISSUED', 'SUPERSEDED'].map((s) => (
          <button key={s || 'all'} type="button" onClick={() => setStatus(s)} aria-pressed={status === s} className={`pr-btn ${status === s ? '!border-[var(--pr-primary)] !bg-[var(--pr-primary-tint)] !text-[var(--pr-primary)]' : ''}`}>
            {s ? t(STATUS[s].label) : t('All')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-[var(--pr-danger)]">{error}</p>}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <p className="flex items-center gap-2 p-6 text-sm text-[var(--pr-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
          </p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--pr-muted)]" />
            <p className="mt-2 font-semibold">{t('No prescriptions yet')}</p>
            <p className="text-sm text-[var(--pr-muted)]">{t('Prescriptions you write appear here.')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--pr-line)]">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(r.status === 'DRAFT' ? `/doctor/prescriptions/${r.id}/edit` : `/doctor/prescriptions/${r.id}`)}
                  className="grid w-full gap-1 px-5 py-3.5 text-left hover:bg-[var(--pr-hover)] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{r.patientName}</span>
                    <span className="text-xs text-[var(--pr-muted)]">
                      {formatDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })} · <span className="font-mono">{r.patientId}</span>
                    </span>
                  </span>
                  <span className="min-w-0 truncate text-sm text-[var(--pr-ink-2)]">
                    {r.diagnosis ? <strong className="font-semibold">{r.diagnosis}: </strong> : null}
                    {r.medicines.join(', ') || r.tests.join(', ') || t('Empty draft')}
                  </span>
                  <span className="flex items-center gap-2">
                    {r.version > 1 && <span className="text-xs text-[var(--pr-muted)]">v{r.version}</span>}
                    <StatusPill status={r.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── One issued prescription ────────────────────────────────────────────────

export const DoctorPrescriptionViewPage: React.FC = () => {
  const { id = '' } = useParams();
  const { t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [rx, setRx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRx(null);
    api
      .getPrescription(id)
      .then((r) => (r.data.status === 'DRAFT' ? navigate(`/doctor/prescriptions/${id}/edit`, { replace: true }) : setRx(r.data)))
      .catch((e) => setError(e.message));
  }, [id, navigate]);

  const act = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      const res = await fn();
      navigate(`/doctor/prescriptions/${res.data.id}/edit`);
    } catch (e: any) {
      if (e?.statusCode === 412) navigate('/doctor/letterhead', { state: { required: true } });
      else showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-[var(--pr-danger)]">{error}</p>;
  if (!rx) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--pr-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
      </div>
    );
  }
  const doc = fromApi(rx) as RxDocument;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-7">
      <Link to="/doctor/prescriptions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pr-primary)]">
        <ArrowLeft className="h-4 w-4" /> {t('All prescriptions')}
      </Link>
      <section className="glass-card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={rx.status} />
          <span className="text-sm text-[var(--pr-muted)]">
            {t('Version {n}', { n: rx.version })} · {t('Issued {date}', { date: formatDate(rx.issuedAt, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pr-btn" onClick={() => openPrint(rx.id)}>
            <Printer className="h-4 w-4" /> {t('Print / Download PDF')}
          </button>
          <button type="button" className="pr-btn" disabled={busy} onClick={() => act(() => api.duplicatePrescription(rx.id))}>
            <Copy className="h-4 w-4" /> {t('Duplicate')}
          </button>
          {rx.status === 'ISSUED' && (
            <button type="button" className="pr-btn pr-btn-primary" disabled={busy} onClick={() => act(() => api.amendPrescription(rx.id))}>
              <Pencil className="h-4 w-4" /> {t('Amend')}
            </button>
          )}
        </div>
      </section>

      {rx.versions?.length > 1 && (
        <nav aria-label={t('Versions')} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--pr-muted)]">{t('Versions')}:</span>
          {rx.versions.map((v: any) => (
            <Link key={v.id} to={`/doctor/prescriptions/${v.id}`} aria-current={v.id === rx.id ? 'page' : undefined} className={`rounded border px-2 py-0.5 ${v.id === rx.id ? 'border-[var(--pr-primary)] font-semibold text-[var(--pr-primary)]' : 'border-[var(--pr-line)]'}`}>
              v{v.version}
            </Link>
          ))}
        </nav>
      )}

      <div className="overflow-x-auto rounded-lg bg-[#e9ecf0] p-3 sm:p-5">
        <PrescriptionDocument doc={doc} />
      </div>
    </div>
  );
};
