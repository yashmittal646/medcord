import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { MedicalDocumentModal } from '../../components/common/MedicalDocumentModal.js';
import { UnifiedTimeline } from '../../components/timeline/UnifiedTimeline.js';
import { eventToDocument, fromClinicalProfile, fromTimelineEvents } from '../../components/timeline/adapters.js';
import type { MedicalRecord } from '../../components/timeline/types.js';
import { useOpenRecordFile } from '../../hooks/useOpenRecordFile.js';

export const PatientTimelinePage: React.FC = () => {
  const { t } = useLanguage();
  const openFile = useOpenRecordFile();
  const [events, setEvents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [timelineRes, profileRes] = await Promise.all([
          api.getTimeline({ limit: 100 }),
          api.getPatientProfile().catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        setEvents(timelineRes.data || []);
        setProfile(profileRes.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('Could not load your timeline'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const records: MedicalRecord[] = useMemo(
    () => [...fromTimelineEvents(events), ...fromClinicalProfile(profile, profile?.createdAt)],
    [events, profile]
  );

  const viewRecord = (r: MedicalRecord) => {
    const event = events.find((e) => String(e.id) === r.recordId);
    if (event) setSelected(eventToDocument(event));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="glass-card p-6 border-slate-200/90">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" aria-hidden="true" />
          {t('timeline.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('Consultations, reports, prescriptions, medications, diagnoses and allergies in one place.')}
        </p>
      </header>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <UnifiedTimeline
        records={records}
        isLoading={isLoading}
        onViewRecord={viewRecord}
        onOpenFile={openFile}
        emptyMessage={t('Your medical history will appear here as you add records.')}
      />

      <MedicalDocumentModal record={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
