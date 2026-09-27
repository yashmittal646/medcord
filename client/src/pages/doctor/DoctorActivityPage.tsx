import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Shield, Eye, Search, Stethoscope, HeartPulse, Lock } from 'lucide-react';

const activityIcons: Record<string, any> = {
  DOCTOR_PATIENT_VIEW: { Icon: Eye, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  DOCTOR_VIEW: { Icon: Eye, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  CONSULTATION_RECORDED: { Icon: Stethoscope, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  CONSULTATION_ADDED: { Icon: Stethoscope, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  HEALTH_PATH_CREATED: { Icon: HeartPulse, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  HEALTH_PATH_UPDATED: { Icon: HeartPulse, color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

const getEventStyle = (action: string) => {
  return activityIcons[action] || { Icon: Lock, color: 'text-slate-700 bg-slate-100 border-slate-200' };
};

const formatAction = (action: string) => {
  return action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
};

export const DoctorActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDoctorActivity(100);
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to load doctor activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.action?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.targetPatient?.name?.toLowerCase().includes(q) ||
      a.targetPatient?.publicId?.toLowerCase().includes(q)
    );
  });

  // Group by date
  const grouped = filteredActivities.reduce((acc: Record<string, any[]>, item: any) => {
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 border-slate-200/90">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Clinical Audit & Compliance Activity Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable log of all patient chart accesses, consultation notes, and health path actions initiated under your clinical credentials.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search activity by action, patient name, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-9 text-sm bg-white"
        />
      </div>

      {/* Stats Banner */}
      {!isLoading && activities.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Clinical Events',
              value: activities.length,
              color: 'text-slate-800',
              bg: 'border-slate-200 bg-white shadow-sm',
            },
            {
              label: 'Patient Chart Lookups',
              value: activities.filter((a) => a.action?.includes('VIEW') || a.action?.includes('LOOKUP')).length,
              color: 'text-emerald-700',
              bg: 'border-emerald-200 bg-emerald-50/50 shadow-sm',
            },
            {
              label: 'Care Plans / Consultations',
              value: activities.filter((a) => a.action?.includes('PATH') || a.action?.includes('CONSULTATION')).length,
              color: 'text-teal-700',
              bg: 'border-teal-200 bg-teal-50/50 shadow-sm',
            },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card p-4 text-center ${stat.bg}`}>
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, events]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{date}</span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2.5">
                {events.map((activity: any) => {
                  const { Icon, color } = getEventStyle(activity.action);
                  return (
                    <div
                      key={activity._id}
                      className="glass-card p-4 border-slate-200/90 hover:border-emerald-300 hover:shadow-sm transition-all flex items-start gap-4"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{formatAction(activity.action)}</span>
                            {activity.targetPatient && (
                              <span className="text-xs text-slate-500 ml-2">
                                for patient{' '}
                                <span className="text-teal-700 font-semibold font-mono">
                                  {activity.targetPatient.name || activity.targetPatient.publicId}
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono shrink-0">
                            {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {activity.description && (
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{activity.description}</p>
                        )}

                        {activity.reason && (
                          <div className="mt-2 text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Clinical Justification / Reason:</span>
                            {activity.reason}
                          </div>
                        )}

                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(activity.metadata).map(([key, val]) => (
                              <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                                {key}: <span className="text-slate-800 font-mono font-medium">{String(val)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No clinical activity recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'No results match your search query.' : 'Your patient lookups, chart views, and consultation notes will be automatically audited here.'}
          </p>
        </div>
      )}
    </div>
  );
};
