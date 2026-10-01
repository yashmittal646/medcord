import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardList, FileText, FlaskConical, Loader2, Printer } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useToast } from '../../context/ToastContext.js';
import { PrescriptionDocument } from '../../components/prescription/PrescriptionDocument.js';
import { RxDocument, fromApi, visitDateLabel } from '../../components/prescription/rx.js';

const openPrint = (id: string) => window.open(`/print/prescription/${id}`, '_blank', 'noopener');

/** Tests the doctor asked for that the patient has not done yet; also shown on the dashboard */
export const TestsToDo: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const [tests, setTests] = useState<any[] | null>(null);

  useEffect(() => {
    api
      .myTestsToDo()
      .then((r) => setTests(r.data ?? []))
      .catch(() => setTests([]));
  }, []);

  const markDone = async (x: any) => {
    try {
      await api.setMyTestStatus(x.prescriptionId, x.testId, 'DONE');
      setTests((all) => all?.filter((y) => y.testId !== x.testId) ?? null);
      showToast(t('Marked as done'), 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  if (!tests || (compact && tests.length === 0)) return null;

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FlaskConical className="h-5 w-5 text-[var(--pr-primary)]" aria-hidden="true" />
          {t('Tests to do')}
          {tests.length > 0 && <span className="rounded-full bg-[var(--pr-primary-tint)] px-2 text-xs font-bold text-[var(--pr-primary)]">{tests.length}</span>}
        </h2>
        {compact && (
          <Link to="/patient/prescriptions" className="text-sm font-semibold text-[var(--pr-primary)]">
            {t('View all')}
          </Link>
        )}
      </div>
      {tests.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--pr-muted)]">{t('No pending tests.')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--pr-line)]">
          {tests.slice(0, compact ? 5 : undefined).map((x) => (
            <li key={x.testId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold">{x.name}</p>
                <p className="text-xs text-[var(--pr-muted)]">
                  {[x.note, x.doctorName, formatDate(x.date, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button type="button" className="pr-btn" onClick={() => markDone(x)}>
                <Check className="h-4 w-4" /> {t('Mark as done')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const PatientPrescriptionsPage: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .myPrescriptions()
      .then((r) => setRows(r.data ?? []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-7">
      <section className="glass-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList className="h-5 w-5 text-[var(--pr-primary)]" aria-hidden="true" />
          {t('Prescriptions')}
        </h2>
        <p className="mt-1 text-sm text-[var(--pr-muted)]">{t('Prescriptions your doctors issued, newest first. Their medicines are also added to your Medications.')}</p>
      </section>

      <TestsToDo />

      {error && <p role="alert" className="text-sm text-[var(--pr-danger)]">{error}</p>}
      <div className="glass-card overflow-hidden">
        {!rows ? (
          <p className="flex items-center gap-2 p-6 text-sm text-[var(--pr-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
          </p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--pr-muted)]" />
            <p className="mt-2 font-semibold">{t('No prescriptions yet')}</p>
            <p className="text-sm text-[var(--pr-muted)]">{t('When a doctor issues you a prescription it appears here automatically.')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--pr-line)]">
            {rows.map((r) => (
              <li key={r.id}>
                <Link to={`/patient/prescriptions/${r.id}`} className="grid gap-1 px-5 py-4 hover:bg-[var(--pr-hover)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] sm:items-center sm:gap-4">
                  <span>
                    <span className="block font-semibold">{formatDate(r.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="text-sm text-[var(--pr-muted)]">{[r.doctorName, r.clinicName].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="min-w-0 truncate text-sm">
                    {r.diagnosis && <strong className="font-semibold">{r.diagnosis}: </strong>}
                    {r.medicines.join(', ')}
                  </span>
                  <span className="text-xs text-[var(--pr-muted)]">
                    {r.nextVisitDate ? `${t('Next visit')}: ${visitDateLabel(r.nextVisitDate)}` : r.testsPending ? t('{n} tests to do', { n: r.testsPending }) : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const PatientPrescriptionViewPage: React.FC = () => {
  const { id = '' } = useParams();
  const { t } = useLanguage();
  const [rx, setRx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRx(null);
    api
      .getPrescription(id)
      .then((r) => setRx(r.data))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-[var(--pr-danger)]">{error}</p>;
  if (!rx) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--pr-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
      </div>
    );
  }
  const current = rx.versions?.find((v: any) => v.status === 'ISSUED');

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/patient/prescriptions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pr-primary)]">
          <ArrowLeft className="h-4 w-4" /> {t('All prescriptions')}
        </Link>
        <button type="button" className="pr-btn pr-btn-primary" onClick={() => openPrint(rx.id)}>
          <Printer className="h-4 w-4" /> {t('Print / Download PDF')}
        </button>
      </div>
      {rx.status === 'SUPERSEDED' && current && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {t('Your doctor has updated this prescription.')}{' '}
          <Link to={`/patient/prescriptions/${current.id}`} className="font-semibold underline">
            {t('See the current version')}
          </Link>
        </p>
      )}
      <div className="overflow-x-auto rounded-lg bg-[#e9ecf0] p-3 sm:p-5">
        <PrescriptionDocument doc={fromApi(rx) as RxDocument} />
      </div>
    </div>
  );
};
