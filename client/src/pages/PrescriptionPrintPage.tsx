import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { PrescriptionDocument } from '../components/prescription/PrescriptionDocument.js';
import { RxDocument, fromApi } from '../components/prescription/rx.js';

/**
 * Clean A4 page for printing or "Save as PDF". Opens the print dialog once the page and its fonts
 * (Noto Sans Devanagari/Kannada/Tamil/Telugu for non-Latin text) have loaded.
 */
export const PrescriptionPrintPage: React.FC = () => {
  const { id = '' } = useParams();
  const { t } = useLanguage();
  const [doc, setDoc] = useState<RxDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPrescription(id)
      .then((r) => {
        setDoc(fromApi(r.data) as RxDocument);
        document.title = `${t('Prescription')} - ${r.data.patientSnapshot?.name ?? ''}`;
      })
      .catch((e) => setError(e.message));
  }, [id, t]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(() => !cancelled && window.print(), 300));
    return () => {
      cancelled = true;
    };
  }, [doc]);

  if (error) return <p className="p-8 text-sm text-red-700">{error}</p>;
  if (!doc) return <p className="p-8 text-sm text-slate-500">{t('Loading…')}</p>;

  return (
    <div className="min-h-screen bg-[#e9ecf0] px-3 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{t('Choose "Save as PDF" in the print dialog to download.')}</p>
        <button type="button" className="pr-btn pr-btn-primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> {t('Print / Download PDF')}
        </button>
      </div>
      <div className="rx-print-root">
        <PrescriptionDocument doc={doc} />
      </div>
    </div>
  );
};
