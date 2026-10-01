import React, { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { enumLabel } from '../utils/enumLabel.js';

/** Admins review medicines doctors added: promote to the shared catalogue or keep private */
export const AdminMedicinesPage: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    api
      .pendingMedicines()
      .then((r) => setRows(r.data ?? []))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, kind: 'promote' | 'reject') => {
    setBusy(id);
    try {
      const res = kind === 'promote' ? await api.promoteMedicine(id) : await api.rejectMedicine(id);
      showToast(kind === 'promote' ? (res.data?.merged ? t('Already in the catalogue; merged') : t('Added to the shared catalogue')) : t('Kept private to the doctor'), 'success');
      setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-7">
      <section className="glass-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t('Medicine review')}</h2>
        <p className="mt-1 text-sm text-[var(--pr-muted)]">{t('Medicines doctors added because they were missing from the list. Promote a correct entry so every doctor can use it.')}</p>
      </section>
      {error && <p role="alert" className="text-sm text-[var(--pr-danger)]">{error}</p>}
      <div className="glass-card overflow-hidden">
        {!rows ? (
          <p className="flex items-center gap-2 p-6 text-sm text-[var(--pr-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…')}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--pr-muted)]">{t('Nothing to review.')}</p>
        ) : (
          <ul className="divide-y divide-[var(--pr-line)]">
            {rows.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {m.brandName} {m.strength && <span className="font-normal text-[var(--pr-muted)]">{m.strength}</span>}
                  </p>
                  <p className="text-xs text-[var(--pr-muted)]">
                    {[enumLabel(m.form), m.genericName, `${m.doctorName ?? ''} (${m.doctorId ?? ''})`, formatDate(m.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="pr-btn" disabled={busy === m.id} onClick={() => act(m.id, 'reject')}>
                    <X className="h-4 w-4" /> {t('Keep private')}
                  </button>
                  <button type="button" className="pr-btn pr-btn-primary" disabled={busy === m.id} onClick={() => act(m.id, 'promote')}>
                    <Check className="h-4 w-4" /> {t('Add to catalogue')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
