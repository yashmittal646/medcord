import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Shield, Eye, Search, AlertTriangle, Stethoscope, Lock } from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';

const activityIcons: Record<string, any> = {
  RECORD_UPLOADED: { Icon: Shield, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  ALLERGY_ADDED: { Icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  ALLERGY_UPDATED: { Icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ALLERGY_DELETED: { Icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  DOCTOR_VIEW: { Icon: Eye, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  EMERGENCY_ACCESS: { Icon: AlertTriangle, color: 'text-red-700 bg-red-50 border-red-200' },
  CONSULTATION_ADDED: { Icon: Stethoscope, color: 'text-teal-700 bg-teal-50 border-teal-200' },
};

const getEventStyle = (action: string) => {
  return activityIcons[action] || { Icon: Lock, color: 'text-slate-700 bg-slate-100 border-slate-200' };
};

const formatAction = (action: string) => enumLabel(action);

export const PatientActivityPage: React.FC = () => {
  const { t, tn } = useLanguage();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMyActivity(100);
      // the API names things timestamp/actor/id; the page was written for createdAt/performedBy/_id
      setActivities((res.data || []).map((a: any) => ({ ...a, _id: a.id, createdAt: a.timestamp, performedBy: a.actor })));
    } catch (err) {
      console.error('Failed to load activity:', err);
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
      a.performedBy?.name?.toLowerCase().includes(q) ||
      (a.messageKey ? t(a.messageKey, a.params) : a.message ?? '').toLowerCase().includes(q)
    );
  });

  // Group by date
  const grouped = filteredActivities.reduce((acc: Record<string, any[]>, item: any) => {
    const date = new Date(item.createdAt).toLocaleDateString(getLocale(), {
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
          <Shield className="w-5 h-5 text-teal-600" />
          
          {t('Privacy & Access Audit Trail')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          
          {t('Real-time audit log — every medical record access, upload, doctor view, and emergency lookup is timestamped and recorded here.')}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('Search activities by action, actor, or description...')}
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
              label: t('Total Audit Logs'),
              value: activities.length,
              color: 'text-slate-800',
              bg: 'border-slate-200 bg-white shadow-sm',
            },
            {
              label: t('Doctor Accesses'),
              value: activities.filter((a) => a.action === 'DOCTOR_VIEW' || a.performedBy?.role === 'DOCTOR').length,
              color: 'text-emerald-700',
              bg: 'border-emerald-200 bg-emerald-50/50 shadow-sm',
            },
            {
              label: t('Emergency Lookups'),
              value: activities.filter((a) => a.action === 'EMERGENCY_ACCESS').length,
              color: 'text-red-700',
              bg: 'border-red-200 bg-red-50/50 shadow-sm',
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
          <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, events]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{date}</span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400">{events.length === 1 ? t('1 event') : t('{count} events', { count: events.length })}</span>
              </div>

              <div className="space-y-2.5">
                {events.map((activity: any) => {
                  const { Icon, color } = getEventStyle(activity.action);
                  return (
                    <div
                      key={activity._id}
                      className="glass-card p-4 border-slate-200/90 hover:border-teal-300 hover:shadow-sm transition-all flex items-start gap-4"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{formatAction(activity.action)}</span>
                            {activity.performedBy && (
                              <span className="text-xs text-slate-500 ml-2">
                                {tn('by {name}', { name: <span className={`font-semibold ${activity.performedBy.role === 'DOCTOR' ? 'text-emerald-700' : 'text-teal-700'}`}>{activity.performedBy.name}</span> })}
                                <span className="text-[10px] text-slate-400 ml-1">({enumLabel(activity.performedBy.role)})</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono shrink-0">
                            {new Date(activity.createdAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {(activity.messageKey || activity.message) && (
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {activity.messageKey ? t(activity.messageKey, activity.params) : activity.message}
                          </p>
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
          <h3 className="text-sm font-semibold text-slate-800">{t('No activity recorded yet')}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? t('No results match your search.') : t('All access events, doctor views, and uploads will appear here.')}
          </p>
        </div>
      )}
    </div>
  );
};
