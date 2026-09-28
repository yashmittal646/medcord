import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { UploadRecordModal } from '../../components/patient/UploadRecordModal.js';
import { MedicalDocumentModal } from '../../components/common/MedicalDocumentModal.js';
import {
  FileText,
  UploadCloud,
  Filter,
  Download,
  Trash2,
  Search,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  HeartPulse,
  File,
  Eye,
} from 'lucide-react';

const RECORD_TYPES = ['PRESCRIPTION', 'LAB_REPORT', 'CONSULTATION', 'CHECKUP', 'OTHER'];

const typeConfig: Record<string, { label: string; color: string; Icon: any }> = {
  PRESCRIPTION: { label: 'Prescription', color: 'text-teal-700 bg-teal-50 border-teal-200', Icon: ClipboardList },
  LAB_REPORT: { label: 'Lab Report', color: 'text-sky-700 bg-sky-50 border-sky-200', Icon: FlaskConical },
  CONSULTATION: { label: 'Consultation', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: Stethoscope },
  CHECKUP: { label: 'Checkup', color: 'text-amber-700 bg-amber-50 border-amber-200', Icon: HeartPulse },
  OTHER: { label: 'Other', color: 'text-slate-700 bg-slate-50 border-slate-200', Icon: File },
};

export const PatientRecordsPage: React.FC = () => {
  const { t } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (typeFilter) params.recordType = typeFilter;
      const res = await api.getRecords(params);
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [typeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this medical record?')) return;
    try {
      await api.deleteRecord(id);
      await fetchRecords();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.doctorName?.toLowerCase().includes(q) ||
      r.facilityName?.toLowerCase().includes(q) ||
      r.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            {t('records.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {records.length} {t('records.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          {t('records.uploadBtn')}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('records.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="glass-input text-xs bg-white py-2.5"
          >
            <option value="">{t('records.allTypes')}</option>
            {RECORD_TYPES.map((tVal) => (
              <option key={tVal} value={tVal}>{typeConfig[tVal]?.label || tVal}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table/List */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="glass-card divide-y divide-slate-100 overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80">
            <span>Record</span>
            <span>Type</span>
            <span>Date</span>
            <span>Physician / Facility</span>
            <span>Actions</span>
          </div>

          {filteredRecords.map((rec) => {
            const conf = typeConfig[rec.recordType] || typeConfig['OTHER'];
            const Icon = conf.Icon;
            return (
              <div
                key={rec._id}
                className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-teal-50/40 transition-colors cursor-pointer group"
                onClick={() => setSelectedRecord(rec)}
              >
                {/* Record Title */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${conf.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                      {rec.title}
                    </p>
                    {rec.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.tags.map((tag: string) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Badge */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${conf.color} w-fit`}>
                  {conf.label}
                </span>

                {/* Date */}
                <span className="text-xs text-slate-600 font-mono">
                  {new Date(rec.recordDate).toLocaleDateString()}
                </span>

                {/* Doctor / Facility */}
                <div className="text-xs text-slate-600">
                  {rec.doctorName && <div className="text-slate-800 font-medium">Dr. {rec.doctorName}</div>}
                  {rec.facilityName && <div className="text-slate-400">{rec.facilityName}</div>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* View / Download Prescription or Document */}
                  <button
                    onClick={() => setSelectedRecord(rec)}
                    title="View & Download Prescription / Document"
                    className="px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Download</span>
                  </button>

                  <button
                    onClick={() => setSelectedRecord(rec)}
                    title="View Document Details"
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(rec._id)}
                    title="Delete record"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">{t('records.emptyTitle')}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || typeFilter
              ? 'No records match your current filters.'
              : t('records.emptySubtitle')}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {t('records.uploadFirst')}
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadRecordModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchRecords}
      />

      {/* Official Medical Prescription / Document Viewer & Download Modal */}
      <MedicalDocumentModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
