import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, Lock, Pencil } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useToast } from '../../context/ToastContext.js';
import { PrescriptionDocument } from '../../components/prescription/PrescriptionDocument.js';
import { Letterhead, RxDocument, newKey } from '../../components/prescription/rx.js';

const EMPTY: Letterhead = { header: { doctorName: '' }, footer: { clinicAddress: '', phone: '' } };

/** One-time letterhead setup: edit, preview, Save & Lock; editing later needs explicit confirmation */
export const DoctorLetterheadPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromPrescription = Boolean((location.state as any)?.required);
  const [lh, setLh] = useState<Letterhead>(EMPTY);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'lock' | 'unlock' | null>(null);

  useEffect(() => {
    api
      .getLetterhead()
      .then((r) => {
        setLh({ header: r.data.header, footer: r.data.footer });
        setIsLocked(r.data.isLocked);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setH = (k: keyof Letterhead['header'], v: string) => setLh((x) => ({ ...x, header: { ...x.header, [k]: v } }));
  const setF = (k: keyof Letterhead['footer'], v: string) => setLh((x) => ({ ...x, footer: { ...x.footer, [k]: v } }));
  const clean = (): Letterhead => ({
    header: {
      doctorName: lh.header.doctorName.trim(),
      qualification: lh.header.qualification?.trim() || undefined,
      specialization: lh.header.specialization?.trim() || undefined,
      registrationNumber: lh.header.registrationNumber?.trim() || undefined,
    },
    footer: { clinicName: lh.footer.clinicName?.trim() || undefined, clinicAddress: lh.footer.clinicAddress.trim(), phone: lh.footer.phone.trim() },
  });

  const run = async (fn: () => Promise<any>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      showToast(done, 'success');
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const save = () => run(() => api.saveLetterhead(clean()), t('Letterhead saved'));
  const lock = async () => {
    if (await run(() => api.lockLetterhead(clean()), t('Letterhead locked'))) {
      setIsLocked(true);
      if (cameFromPrescription) navigate('/doctor/prescriptions/new');
    }
  };
  const unlock = async () => {
    if (await run(() => api.unlockLetterhead(), t('Letterhead unlocked for editing'))) setIsLocked(false);
  };

  const sample: RxDocument = {
    date: new Date().toISOString(),
    patient: { name: t('Patient name'), patientId: 'PAT-XXXXXX' },
    comorbidities: [],
    medicines: [
      { key: newKey(), medicineId: 'x', name: 'Paracetamol 500mg Tablet', dosage: { morning: 1, afternoon: 0, night: 1 }, frequency: 'DAILY', duration: { value: 5, unit: 'DAYS' }, timing: t('After meals') },
    ],
    labTests: [],
    letterhead: clean(),
  };

  const field = (id: string, label: string, value: string | undefined, onChange: (v: string) => void, opts: { required?: boolean; placeholder?: string; textarea?: boolean } = {}) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-[var(--pr-ink-2)]">
        {label} {opts.required ? <span className="text-[var(--pr-danger)]">*</span> : <span className="font-normal text-[var(--pr-muted)]">({t('optional')})</span>}
      </label>
      {opts.textarea ? (
        <textarea id={id} rows={2} disabled={isLocked} className="glass-input w-full resize-none" placeholder={opts.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} disabled={isLocked} className="glass-input w-full" placeholder={opts.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--pr-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7">
      {cameFromPrescription && !isLocked && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('Set up and lock your prescription letterhead before writing prescriptions.')}
        </div>
      )}

      <section className="glass-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t('Prescription letterhead')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--pr-muted)]">
              {t('This header and footer are printed on every prescription you issue. Lock it once it looks right; it is then applied automatically.')}
            </p>
          </div>
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--pr-primary-tint)] px-3 py-1.5 text-sm font-semibold text-[var(--pr-primary)]">
              <Lock className="h-4 w-4" /> {t('Locked')}
            </span>
          ) : null}
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section className="glass-card space-y-5 p-5 sm:p-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--pr-muted)]">{t('Header (top of the page)')}</h3>
            {field('lh-name', t('Doctor name'), lh.header.doctorName, (v) => setH('doctorName', v), { required: true, placeholder: 'Dr. Anil Mehta' })}
            {field('lh-qual', t('Qualification'), lh.header.qualification, (v) => setH('qualification', v), { placeholder: 'MBBS, MD (Dermatology)' })}
            {field('lh-spec', t('Specialization'), lh.header.specialization, (v) => setH('specialization', v), { placeholder: t('e.g. Dermatologist & Trichologist') })}
            {field('lh-reg', t('Registration number'), lh.header.registrationNumber, (v) => setH('registrationNumber', v), { placeholder: 'MMC-12345' })}
          </div>
          <div className="space-y-3 border-t border-[var(--pr-line)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--pr-muted)]">{t('Footer (bottom of the page)')}</h3>
            {field('lh-clinic', t('Clinic name'), lh.footer.clinicName, (v) => setF('clinicName', v))}
            {field('lh-addr', t('Clinic address'), lh.footer.clinicAddress, (v) => setF('clinicAddress', v), { required: true, textarea: true })}
            {field('lh-phone', t('Contact number'), lh.footer.phone, (v) => setF('phone', v), { required: true, placeholder: '+91 98765 43210' })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--pr-line)] pt-5">
            {isLocked ? (
              <>
                <button type="button" className="pr-btn" onClick={() => setConfirm('unlock')} disabled={busy}>
                  <Pencil className="h-4 w-4" /> {t('Edit letterhead')}
                </button>
                <Link to="/doctor/prescriptions/new" className="pr-btn pr-btn-primary">
                  {t('Write a prescription')}
                </Link>
              </>
            ) : (
              <>
                <button type="button" className="pr-btn" onClick={save} disabled={busy}>
                  {t('Save draft')}
                </button>
                <button type="button" className="pr-btn pr-btn-primary" onClick={() => setConfirm('lock')} disabled={busy}>
                  <Lock className="h-4 w-4" /> {t('Save & Lock')}
                </button>
              </>
            )}
          </div>
        </section>

        <section className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--pr-muted)]">{t('Preview')}</p>
          <div className="overflow-x-auto rounded-lg bg-[#e9ecf0] p-3 sm:p-5">
            <PrescriptionDocument doc={sample} className="!min-h-[200mm]" />
          </div>
        </section>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              {confirm === 'lock' ? <CheckCircle2 className="h-5 w-5 text-[var(--pr-primary)]" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {confirm === 'lock' ? t('Lock this letterhead?') : t('Edit your locked letterhead?')}
            </h3>
            <p className="mt-2 text-sm text-[var(--pr-muted)]">
              {confirm === 'lock'
                ? t('It will be printed on every prescription you issue and cannot be changed while writing one.')
                : t('Prescriptions you already issued keep the letterhead they were issued with. New prescriptions are blocked until you lock it again.')}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="pr-btn" onClick={() => setConfirm(null)}>
                {t('Cancel')}
              </button>
              <button type="button" className="pr-btn pr-btn-primary" onClick={confirm === 'lock' ? lock : unlock} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirm === 'lock' ? t('Save & Lock') : t('Unlock and edit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
