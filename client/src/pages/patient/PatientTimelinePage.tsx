import React, { useState, useEffect } from 'react';
import { api, getRecordFileUrl } from '../../services/api.js';
import { Clock, Filter, Calendar, Download } from 'lucide-react';

export const PatientTimelinePage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
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
            Longitudinal Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified chronological medical history across doctors, labs, and clinics
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
            <option value="">All Record Types</option>
            <option value="PRESCRIPTION">Prescriptions</option>
            <option value="LAB_REPORT">Lab Reports</option>
            <option value="CONSULTATION">Consultations</option>
            <option value="CHECKUP">Checkups</option>
            <option value="OTHER">Other Documents</option>
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

              <div className="glass-card p-5 border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeColor(event.recordType)}`}>
                      {event.recordType}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(event.recordDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {event.hasAttachment && (
                    <a
                      href={getRecordFileUrl(event.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{event.fileDetails?.originalName || 'Download Document'}</span>
                    </a>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{event.title}</h3>

                {event.diagnosis && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <strong>Diagnosis / Assessment:</strong> {event.diagnosis}
                  </div>
                )}

                {event.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  {event.doctorName && (
                    <span>Physician: <strong className="text-slate-800">Dr. {event.doctorName}</strong></span>
                  )}
                  {event.facilityName && (
                    <>
                      <span>•</span>
                      <span>Clinic: <strong className="text-slate-800">{event.facilityName}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>Recorded by: {event.uploadedBy.name} ({event.uploadedBy.role})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-500">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No timeline records found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {recordTypeFilter ? 'No records match the selected filter.' : 'Upload prescriptions or lab reports to populate your medical timeline.'}
          </p>
        </div>
      )}
    </div>
  );
};
