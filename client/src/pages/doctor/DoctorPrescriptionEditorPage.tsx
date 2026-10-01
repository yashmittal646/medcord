import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, CloudOff, Eye, Loader2, Search, Send, Trash2, UserPlus } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { useToast } from '../../context/ToastContext.js';
import { enumLabel } from '../../utils/enumLabel.js';
import { PrescriptionDocument } from '../../components/prescription/PrescriptionDocument.js';
import { MedicineRows, emptyLine } from '../../components/prescription/MedicineRows.js';
import { LabTestPicker } from '../../components/prescription/LabTestPicker.js';
import { TagInput } from '../../components/prescription/TagInput.js';
import { COMORBIDITY_SUGGESTIONS, Letterhead, RxDocument, fromApi, toApiBody, visitDateLabel } from '../../components/prescription/rx.js';

const today = () => new Date().toISOString().slice(0, 10);
const backupKey = (id: string) => `FollowUp_rx_draft_${id}`;
const readBackup = (id: string) => {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as { savedAt: number; doc: any }) : null;
  } catch {
    return null;
  }
};
const writeBackup = (id: string, doc: any) => {
  try {
    localStorage.setItem(backupKey(id), JSON.stringify({ savedAt: Date.now(), doc }));
  } catch {
    /* storage full or blocked: the server autosave still runs */
  }
};
const clearBackup = (id: string) => {
  try {
    localStorage.removeItem(backupKey(id));
  } catch {
    /* ignore */
  }
};

/** Sends the doctor to the letterhead setup when the server says it is not locked yet */
const useLetterheadGuard = () => {
  const navigate = useNavigate();
  return useCallback(
    (e: any) => {
      if (e?.statusCode === 412) {
        navigate('/doctor/letterhead', { replace: true, state: { required: true } });
        return true;
      }
      return false;
    },
    [navigate]
  );
};

// ── Step 1: choose the patient ──────────────────────────────────────────────

export const DoctorPrescriptionNewPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const guard = useLetterheadGuard();
  const [patients, setPatients] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (patientId: string) => {
      setCreating(patientId);
      setError(null);
      try {
        const res = await api.createPrescription({ patientId, date: today() });
        navigate(`/doctor/prescriptions/${res.data.id}/edit`, { replace: true });
      } catch (e: any) {
        if (!guard(e)) setError(e.message);
        setCreating(null);
      }
    },
    [navigate, guard]
  );

  useEffect(() => {
    (async () => {
      try {
        const lh = await api.getLetterhead();
        if (!lh.data.isLocked) return guard({ statusCode: 412 });
        const res = await api.prescriptionPatients();
        setPatients(res.data ?? []);
        const pre = params.get('patientId');
        if (pre) start(pre);
      } catch (e: any) {
        if (!guard(e)) setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = patients.filter((p) => `${p.name} ${p.patientId}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-7">
      <Link to="/doctor/prescriptions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pr-primary)]">
        <ArrowLeft className="h-4 w-4" /> {t('All prescriptions')}
      </Link>
      <section className="glass-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t('New prescription')}</h2>
        <p className="mt-1 text-sm text-[var(--pr-muted)]">{t('Choose the patient. Only patients who have given you access are listed.')}</p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pr-muted)]" />
          <input autoFocus className="glass-input w-full" style={{ paddingLeft: 36 }} placeholder={t('Search by name or PAT-ID')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search by name or PAT-ID')} />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--pr-danger)]">
            {error}
          </p>
        )}
        <ul className="mt-4 divide-y divide-[var(--pr-line)] rounded-md border border-[var(--pr-line)]">
          {loading && (
            <li className="flex items-center gap-2 px-4 py-6 text-sm text-[var(--pr-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
            </li>
          )}
          {!loading && shown.length === 0 && <li className="px-4 py-6 text-sm text-[var(--pr-muted)]">{t('No connected patients found.')}</li>}
          {shown.map((p) => (
            <li key={p.patientId}>
              <button type="button" onClick={() => start(p.patientId)} disabled={Boolean(creating)} className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--pr-hover)] disabled:opacity-60">
                <span>
                  <span className="block font-semibold">{p.name}</span>
                  <span className="text-xs text-[var(--pr-muted)]">
                    <span className="font-mono">{p.patientId}</span>
                    {p.age !== undefined && ` · ${t('{n} yrs', { n: p.age })}`}
                    {p.gender && ` · ${enumLabel(p.gender)}`}
                  </span>
                </span>
                {creating === p.patientId ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-sm font-semibold text-[var(--pr-primary)]">{t('Start')}</span>}
              </button>
            </li>
          ))}
        </ul>
        <Link to="/doctor/lookup" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--pr-primary)]">
          <UserPlus className="h-4 w-4" /> {t('New patient? Request access with their PAT-ID')}
        </Link>
      </section>
    </div>
  );
};

// ── Step 2: write it ────────────────────────────────────────────────────────

type SaveState = 'saved' | 'saving' | 'pending' | 'offline';

export const DoctorPrescriptionEditorPage: React.FC = () => {
  const { id = '' } = useParams();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const guard = useLetterheadGuard();

  const [doc, setDoc] = useState<Omit<RxDocument, 'letterhead'> | null>(null);
  const [letterhead, setLetterhead] = useState<Letterhead | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [preview, setPreview] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const version = useRef(0);
  const savedVersion = useRef(0);
  const docRef = useRef(doc);
  docRef.current = doc;

  // Load the draft (and any newer copy kept on this device)
  useEffect(() => {
    (async () => {
      try {
        const [rxRes, lhRes] = await Promise.all([api.getPrescription(id), api.getLetterhead()]);
        const rx = rxRes.data;
        if (rx.status !== 'DRAFT') return navigate(`/doctor/prescriptions/${id}`, { replace: true });
        if (!lhRes.data.isLocked) return guard({ statusCode: 412 });
        setLetterhead({ header: lhRes.data.header, footer: lhRes.data.footer });
        const fromServer = fromApi(rx);
        const backup = readBackup(id);
        if (backup && backup.savedAt > +new Date(rx.updatedAt)) {
          setDoc({ ...fromServer, ...backup.doc, patient: fromServer.patient });
          version.current = 1; // push the newer local copy to the server
          setSaveState('pending');
        } else {
          clearBackup(id);
          setDoc({ ...fromServer, medicines: fromServer.medicines.length ? fromServer.medicines : [emptyLine()] });
        }
      } catch (e: any) {
        if (!guard(e)) setLoadError(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const change = (patch: Partial<Omit<RxDocument, 'letterhead'>>) => {
    setDoc((d) => (d ? { ...d, ...patch } : d));
    version.current++;
    setSaveState('pending');
  };

  const save = useCallback(async () => {
    const current = docRef.current;
    if (!current || savedVersion.current === version.current) return true;
    const v = version.current;
    setSaveState('saving');
    try {
      await api.updatePrescription(id, toApiBody(current));
      savedVersion.current = v;
      if (version.current === v) {
        clearBackup(id);
        setSaveState('saved');
      }
      setSavedAt(new Date());
      return true;
    } catch (e: any) {
      if (guard(e)) return false;
      setSaveState('offline');
      if (e?.statusCode && e.statusCode < 500) setIssueError(e.message);
      return false;
    }
  }, [id, guard]);

  // Autosave 1.2 s after the last change; every change is also kept on this device right away
  useEffect(() => {
    if (!doc || saveState !== 'pending') return;
    writeBackup(id, { ...doc, patient: undefined });
    const timer = setTimeout(save, 1200);
    return () => clearTimeout(timer);
  }, [doc, saveState, save, id]);

  // Save before leaving the page
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (savedVersion.current !== version.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      void save();
    };
  }, [save]);

  const issue = async () => {
    setIssuing(true);
    setIssueError(null);
    try {
      if (!(await save())) throw new Error(t('Could not save the latest changes. Check your connection and try again.'));
      await api.issuePrescription(id);
      clearBackup(id);
      showToast(t('Prescription issued and sent to the patient'), 'success');
      navigate(`/doctor/prescriptions/${id}`, { replace: true });
    } catch (e: any) {
      if (!guard(e)) setIssueError(e.message);
      setConfirmIssue(false);
    } finally {
      setIssuing(false);
    }
  };

  const discard = async () => {
    if (!window.confirm(t('Delete this draft?'))) return;
    try {
      await api.deletePrescription(id);
      clearBackup(id);
      version.current = savedVersion.current;
      navigate('/doctor/prescriptions', { replace: true });
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const fullDoc: RxDocument | null = useMemo(() => (doc && letterhead ? { ...doc, letterhead } : null), [doc, letterhead]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-7">
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {loadError}
        </p>
      </div>
    );
  }
  if (!doc || !letterhead) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--pr-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
      </div>
    );
  }

  const section = (title: string, children: React.ReactNode, hint?: string) => (
    <section className="glass-card space-y-3 p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {hint && <p className="text-xs text-[var(--pr-muted)]">{hint}</p>}
      </div>
      {children}
    </section>
  );

  const saveLabel =
    saveState === 'saving'
      ? t('Saving…')
      : saveState === 'pending'
      ? t('Unsaved changes')
      : saveState === 'offline'
      ? t('Not saved to the server yet (kept on this device)')
      : savedAt
      ? t('Saved at {time}', { time: savedAt.toLocaleTimeString(getLocale(), { hour: 'numeric', minute: '2-digit' }) })
      : t('Draft saved');

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 pb-28 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/doctor/prescriptions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pr-primary)]">
          <ArrowLeft className="h-4 w-4" /> {t('All prescriptions')}
        </Link>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${saveState === 'offline' ? 'text-[var(--pr-warn)]' : 'text-[var(--pr-muted)]'}`} role="status" aria-live="polite">
          {saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === 'offline' ? <CloudOff className="h-3.5 w-3.5" /> : saveState === 'saved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {saveLabel}
        </span>
      </div>

      {doc.version && doc.version > 1 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{t('You are amending this prescription. Issuing creates version {n}; the previous version stays on record.', { n: doc.version })}</p>
      )}

      {/* 1. Patient and date */}
      {section(
        t('Patient and date'),
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">{doc.patient.name}</p>
            <p className="text-sm text-[var(--pr-muted)]">
              <span className="font-mono">{doc.patient.patientId}</span>
              {doc.patient.age !== undefined && ` · ${t('{n} yrs', { n: doc.patient.age })}`}
              {doc.patient.gender && ` · ${enumLabel(doc.patient.gender)}`}
            </p>
          </div>
          <div>
            <label htmlFor="rx-date" className="mb-1 block text-xs font-semibold text-[var(--pr-ink-2)]">
              {t('Date')}
            </label>
            <input id="rx-date" type="date" className="glass-input" value={doc.date.slice(0, 10)} onChange={(e) => change({ date: e.target.value })} />
          </div>
        </div>
      )}

      {/* 2-4. Clinical notes */}
      {section(
        t('Clinical notes'),
        <div className="grid gap-4">
          <div>
            <label htmlFor="rx-complaints" className="mb-1 block text-sm font-semibold text-[var(--pr-ink-2)]">
              {t('Complaints')}
            </label>
            <textarea id="rx-complaints" rows={3} className="glass-input w-full" placeholder={t('e.g. Hair fall for 3 months, dandruff')} value={doc.complaints ?? ''} onChange={(e) => change({ complaints: e.target.value })} />
          </div>
          <div>
            <label htmlFor="rx-diagnosis" className="mb-1 block text-sm font-semibold text-[var(--pr-ink-2)]">
              {t('Diagnosis')}
            </label>
            <input id="rx-diagnosis" className="glass-input w-full" placeholder={t('e.g. Androgenetic alopecia')} value={doc.diagnosis ?? ''} onChange={(e) => change({ diagnosis: e.target.value })} />
          </div>
          <div>
            <label htmlFor="rx-comorbid" className="mb-1 block text-sm font-semibold text-[var(--pr-ink-2)]">
              {t('Comorbidities')}
            </label>
            <TagInput id="rx-comorbid" tags={doc.comorbidities} onChange={(c) => change({ comorbidities: c })} suggestions={COMORBIDITY_SUGGESTIONS} placeholder={t('Type and press Enter')} />
          </div>
        </div>
      )}

      {/* 5. Medicines */}
      {section(
        t('Medicines'),
        <MedicineRows rows={doc.medicines} onChange={(m) => change({ medicines: m })} />,
        t('Tab or Enter moves to the next field. Enter on the last field adds a new medicine.')
      )}

      {/* 6. Lab tests */}
      {section(t('Lab tests / Investigations'), <LabTestPicker tests={doc.labTests} onChange={(l) => change({ labTests: l })} />)}

      {/* 7. Next visit */}
      {section(
        t('Next visit'),
        <div className="flex flex-wrap items-center gap-3">
          <input id="rx-next" type="date" aria-label={t('Next visit')} min={today()} className="glass-input" value={doc.nextVisitDate?.slice(0, 10) ?? ''} onChange={(e) => change({ nextVisitDate: e.target.value || null })} />
          {[
            [7, t('In 1 week')],
            [14, t('In 2 weeks')],
            [30, t('In 1 month')],
          ].map(([days, label]) => (
            <button
              key={String(days)}
              type="button"
              className="pr-btn"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + Number(days));
                change({ nextVisitDate: d.toISOString().slice(0, 10) });
              }}
            >
              {label}
            </button>
          ))}
          {doc.nextVisitDate && (
            <>
              <span className="text-sm font-semibold">{visitDateLabel(doc.nextVisitDate)}</span>
              <button type="button" className="text-sm text-[var(--pr-muted)] underline" onClick={() => change({ nextVisitDate: null })}>
                {t('Clear')}
              </button>
            </>
          )}
        </div>,
        t('Optional')
      )}

      {issueError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {issueError}
        </p>
      )}

      {/* Action bar */}
      <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-[var(--pr-line)] bg-white/95 px-4 py-3 lg:left-[16.5rem]" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <button type="button" className="pr-btn" onClick={discard}>
            <Trash2 className="h-4 w-4" /> {t('Delete draft')}
          </button>
          <div className="flex gap-2">
            <button type="button" className="pr-btn" onClick={() => setPreview(true)}>
              <Eye className="h-4 w-4" /> {t('Preview')}
            </button>
            <button type="button" className="pr-btn pr-btn-primary" onClick={() => setConfirmIssue(true)}>
              <Send className="h-4 w-4" /> {t('Issue prescription')}
            </button>
          </div>
        </div>
      </div>

      {preview && fullDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={t('Preview')} onClick={() => setPreview(false)}>
          <div className="mx-auto max-w-[220mm]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2 rounded-md bg-white px-4 py-2.5">
              <p className="text-sm font-semibold">{t('Preview: this is exactly what the patient will receive')}</p>
              <div className="flex gap-2">
                <button type="button" className="pr-btn" onClick={() => setPreview(false)}>
                  {t('Back to editing')}
                </button>
                <button
                  type="button"
                  className="pr-btn pr-btn-primary"
                  onClick={() => {
                    setPreview(false);
                    setConfirmIssue(true);
                  }}
                >
                  {t('Issue prescription')}
                </button>
              </div>
            </div>
            <PrescriptionDocument doc={fullDoc} />
          </div>
        </div>
      )}

      {confirmIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-base font-semibold">{t('Issue this prescription?')}</h3>
            <p className="mt-2 text-sm text-[var(--pr-muted)]">
              {t('It will be added to {name}\'s records and medicines. After issuing it cannot be edited; changes are made with Amend, which creates a new version.', { name: doc.patient.name })}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="pr-btn" onClick={() => setConfirmIssue(false)} disabled={issuing}>
                {t('Cancel')}
              </button>
              <button type="button" className="pr-btn pr-btn-primary" onClick={issue} disabled={issuing}>
                {issuing && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Issue prescription')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
