import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { MedicalDocumentModal } from '../../components/common/MedicalDocumentModal.js';
import { Clock, Filter, Download } from 'lucide-react';
import { enumLabel } from '../../utils/enumLabel.js';

export const PatientTimelinePage: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [recordTypeFilter, setRecordTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (recordTypeFilter) params.recordType = recordTypeFilter;
      const res = await api.getTimeline(params);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [recordTypeFilter]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'PRESCRIPTION':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'LAB_REPORT':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'CONSULTATION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CHECKUP':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            {t('timeline.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('timeline.subtitle')}
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="glass-input text-xs bg-white py-1.5"
          >
            <option value="">{t('records.allTypes')}</option>
            <option value="PRESCRIPTION">{t('Prescriptions')}</option>
            <option value="LAB_REPORT">{t('Lab Reports')}</option>
            <option value="CONSULTATION">{t('Consultations')}</option>
            <option value="CHECKUP">{t('Checkups')}</option>
            <option value="OTHER">{t('Other Documents')}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : events.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 space-y-8 my-4">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-teal-500 group-hover:bg-teal-500 group-hover:scale-125 transition-all shadow-md shadow-teal-500/30" />

              <div
                onClick={() => setSelectedRecord(event)}
                className="glass-card p-5 border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all space-y-3 cursor-pointer group/card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeColor(event.recordType)}`}>
                      {enumLabel(event.recordType)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(event.recordDate).toLocaleDateString(getLocale())}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedRecord(event)}
                      className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('Download / View')}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover/card:text-teal-700 transition-colors">{event.title}</h3>
                  {event.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                  {event.doctorName && (
                    <span>{t('Doctor:')} <strong className="text-slate-800 font-medium">{t('Dr. {doctorName}', { doctorName: event.doctorName })}</strong></span>
                  )}
                  {event.facilityName && (
                    <span>{t('Facility:')} <strong className="text-slate-800 font-medium">{event.facilityName}</strong></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-xs">
          {t('timeline.empty')}
        </div>
      )}

      {/* Official Medical Prescription / Document Viewer & Download Modal */}
      <MedicalDocumentModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
