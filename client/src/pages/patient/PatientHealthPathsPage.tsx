import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const PatientHealthPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
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
    if (!confirm(`Mark this health path as ${status}?`)) return;
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
    ACTIVE: 'bg-teal-50 text-teal-700 border-teal-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            Health Paths & Treatment Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physician-directed treatment episodes with medication regimens and progress notes
          </p>
        </div>
        <div className="flex gap-2">
          {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                statusFilter === s
                  ? statusColors[s] + ' shadow-sm font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : paths.length > 0 ? (
        <div className="space-y-4">
          {paths.map((hp) => (
            <div key={hp._id} className="glass-card border-slate-200/90 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-base font-bold text-slate-900">{hp.condition}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[hp.status]}`}>
                      {hp.status}
                    </span>
                  </div>
                  {hp.description && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{hp.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Dr. {hp.doctorName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(hp.startDate).toLocaleDateString()}
                      {hp.endDate && ` → ${new Date(hp.endDate).toLocaleDateString()}`}
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
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleStatusChange(hp._id, 'ARCHIVED')}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === hp._id ? null : hp._id)}
                    className="px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    Notes ({hp.notes?.length || 0})
                    {expandedId === hp._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Medications */}
              {hp.medications?.length > 0 && (
                <div className="px-6 pb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">
                    Prescribed Medications:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hp.medications.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs"
                      >
                        <Pill className="w-3 h-3 text-teal-600" />
                        <span className="font-semibold text-slate-800">{m.medicine}</span>
                        <span className="text-teal-700 font-mono font-medium">{m.dosage}</span>
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
                              <span className="text-xs font-semibold text-slate-800">{note.by?.name || 'Unknown'}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                note.by?.role === 'DOCTOR' ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                              }`}>{note.by?.role}</span>
                              <span className="text-[11px] text-slate-400 ml-auto">{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{note.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">No progress notes yet.</p>
                  )}

                  {/* Add Note Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a progress note..."
                      value={noteText[hp._id] || ''}
                      onChange={(e) => setNoteText((prev) => ({ ...prev, [hp._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote(hp._id)}
                      className="glass-input flex-1 text-sm bg-white"
                    />
                    <button
                      onClick={() => handleAddNote(hp._id)}
                      disabled={sendingNote === hp._id || !noteText[hp._id]?.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingNote === hp._id ? 'Sending...' : 'Add Note'}
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
          <h3 className="text-sm font-semibold text-slate-800">No {statusFilter.toLowerCase()} treatment plans</h3>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === 'ACTIVE'
              ? 'When a doctor creates a treatment episode for you, it will appear here.'
              : `No ${statusFilter.toLowerCase()} health paths found.`}
          </p>
        </div>
      )}
    </div>
  );
};
