import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import {
  HeartPulse,
  CheckCircle2,
  Archive,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Pill,
  Calendar,
  User,
  Send,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';

export const DoctorHealthPathsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [sendingNote, setSendingNote] = useState<string | null>(null);

  const fetchPaths = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getHealthPaths(params);
      setPaths(res.data || []);
    } catch (err) {
      console.error('Failed to load health paths:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!confirm(t('Mark this care plan as {status}?', { status: enumLabel(status) }))) return;
    try {
      await api.updateHealthPathStatus(id, status);
      await fetchPaths();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleAddNote = async (pathId: string) => {
    const note = noteText[pathId]?.trim();
    if (!note) return;
    try {
      setSendingNote(pathId);
      await api.addHealthPathNote(pathId, note);
      setNoteText((prev) => ({ ...prev, [pathId]: '' }));
      await fetchPaths();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSendingNote(null);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const filteredPaths = paths.filter((hp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      hp.condition?.toLowerCase().includes(q) ||
      hp.patientName?.toLowerCase().includes(q) ||
      hp.patientPublicId?.toLowerCase().includes(q) ||
      hp.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            
            {t('Clinical Treatment Protocols & Health Paths')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            
            {t('Monitor longitudinal patient progress, manage active prescriptions, and log clinical milestones')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                statusFilter === s
                  ? statusColors[s] + ' shadow-sm font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
              }`}
            >
              {enumLabel(s)}
            </button>
          ))}
          <button
            onClick={() => navigate('/doctor/lookup')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center gap-1.5 ml-2 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />  {t('Lookup Patient')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('Filter care plans by condition, patient name, or PAT ID...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-9 text-sm bg-white"
        />
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filteredPaths.length > 0 ? (
        <div className="space-y-4">
          {filteredPaths.map((hp) => (
            <div key={hp._id} className="glass-card border-slate-200/90 hover:border-emerald-300 hover:shadow-sm transition-all overflow-hidden">
              {/* Card Header */}
              <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">{hp.condition}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[hp.status]}`}>
                      {enumLabel(hp.status)}
                    </span>
                  </div>

                  {hp.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{hp.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    {hp.patientPublicId && (
                      <button
                        onClick={() => navigate(`/doctor/patient/${hp.patientPublicId}`)}
                        className="flex items-center gap-1.5 font-mono text-teal-700 hover:text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                      >
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        
                        {t('Patient:')} {hp.patientName || hp.patientPublicId}
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(hp.startDate).toLocaleDateString(getLocale())}
                      {hp.endDate && ` → ${new Date(hp.endDate).toLocaleDateString(getLocale())}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {hp.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(hp._id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        
                        {t('Mark Complete')}
                      </button>
                      <button
                        onClick={() => handleStatusChange(hp._id, 'ARCHIVED')}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        
                        {t('Archive')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === hp._id ? null : hp._id)}
                    className="px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    
                    {t('Notes (')}{hp.notes?.length || 0})
                    {expandedId === hp._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Medications */}
              {hp.medications?.length > 0 && (
                <div className="px-6 pb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">
                    
                    {t('Prescribed Regimen:')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hp.medications.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs"
                      >
                        <Pill className="w-3 h-3 text-emerald-600" />
                        <span className="font-semibold text-slate-800">{m.medicine}</span>
                        <span className="text-emerald-700 font-mono font-medium">{m.dosage}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600">{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expandable Notes Section */}
              {expandedId === hp._id && (
                <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/60 space-y-4">
                  {/* Existing Notes */}
                  {hp.notes?.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {hp.notes.map((note: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            note.by?.role === 'DOCTOR'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-teal-100 text-teal-700 border border-teal-200'
                          }`}>
                            {note.by?.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-800">{note.by?.name || t('Practitioner')}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                note.by?.role === 'DOCTOR' ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                              }`}>{enumLabel(note.by?.role)}</span>
                              <span className="text-[11px] text-slate-400 ml-auto">{new Date(note.createdAt).toLocaleDateString(getLocale())}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{note.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">{t('No clinical progress notes yet.')}</p>
                  )}

                  {/* Add Note Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('Add physician progress note or follow-up comment...')}
                      value={noteText[hp._id] || ''}
                      onChange={(e) => setNoteText((prev) => ({ ...prev, [hp._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote(hp._id)}
                      className="glass-input flex-1 text-sm bg-white"
                    />
                    <button
                      onClick={() => handleAddNote(hp._id)}
                      disabled={sendingNote === hp._id || !noteText[hp._id]?.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingNote === hp._id ? t('Saving...') : t('Add Note')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <HeartPulse className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">{t('No {status} health paths found', { status: enumLabel(statusFilter) })}</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            
            {t('Search for a patient to construct structured multi-week care protocols and medication regimens.')}
          </p>
          <button
            onClick={() => navigate('/doctor/lookup')}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-all inline-flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            
            {t('Open Patient Search')}
          </button>
        </div>
      )}
    </div>
  );
};
