import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import type { IDoctorProfile } from '../../types/index.js';
import { enumLabel } from '../../utils/enumLabel.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { api } from '../../services/api.js';
import {
  Stethoscope,
  Search,
  HeartPulse,
  Eye,
  ArrowUpRight,
  Activity,

  Clock,
} from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { greeting } from '../../utils/greeting.js';

export const DoctorDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const doctorProfile = profile as IDoctorProfile | null;
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any[]>([]);
  const [healthPaths, setHealthPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lookupId, setLookupId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [actRes, pathRes] = await Promise.all([
          api.getDoctorActivity(20),
          api.getHealthPaths({ status: 'ACTIVE' }),
        ]);
        setActivity(actRes.data || []);
        setHealthPaths(pathRes.data || []);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupId.trim()) {
      navigate(`/doctor/lookup?id=${encodeURIComponent(lookupId.trim())}`);
    }
  };

  const recentLookups = activity.filter(
    (a) => a.action === 'DOCTOR_VIEW' || a.action === 'PATIENT_RECORD_VIEW' || a.action === 'DOCTOR_LOOKUP'
  );

  const todayActivity = activity.filter((a) => {
    const today = new Date().toDateString();
    return new Date(a.createdAt).toDateString() === today;
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5 ">

      {/* ── Doctor header ── */}
      <section className="glass-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-[var(--pr-muted)]">{greeting(t('Dr. {name}', { name: (user?.name || '').split(' ')[0] }))}</p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--pr-ink)]">{t('Dr. {name}', { name: user?.name })}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--pr-ink-2)]">
              <IdentityBadge id={user?.publicId || ''} type="DOCTOR" size="sm" showLabel={false} />
              {doctorProfile?.specialization && (
                <span className="font-semibold">
                  {enumLabel(doctorProfile.specialization)}
                  {doctorProfile.hospitalAffiliation ? <span className="font-normal text-[var(--pr-muted)]"> · {doctorProfile.hospitalAffiliation}</span> : null}
                </span>
              )}
            </div>
          </div>

          {/* Quick lookup */}
          <form onSubmit={handleQuickLookup} className="flex w-full gap-2 lg:w-auto" role="search">
            <label htmlFor="quick-lookup-input" className="sr-only">{t('PAT-XXXXXX lookup')}</label>
            <input
              type="text"
              placeholder={t('PAT-XXXXXX lookup')}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value.toUpperCase())}
              className="glass-input min-w-0 flex-1 font-mono uppercase lg:w-56"
              id="quick-lookup-input"
            />
            <button type="submit" className="pr-btn pr-btn-primary shrink-0">
              <Search className="h-4 w-4" aria-hidden="true" />
              {t('Search')}
            </button>
          </form>
        </div>
      </section>

      {/* ── Figures ── */}
      <div className="portal-figs" style={{ ['--cols' as any]: 3 }}>
        {[
          { to: '/doctor/activity', value: todayActivity, label: t('Patients Accessed Today') },
          { to: '/doctor/health-paths', value: healthPaths.length, label: t('Active Treatment Plans') },
          { to: '/doctor/lookup', value: recentLookups.length, label: t('Total Chart Lookups') },
        ].map((f) => (
          <Link key={f.label} to={f.to} className="block transition-colors hover:bg-[var(--pr-hover)]">
            <p className="portal-fig-value">{isLoading ? <span className="skeleton inline-block h-7 w-8 rounded" /> : f.value}</p>
            <p className="portal-fig-label">{f.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Main Content: 2 columns ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Patient Lookups */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1f4e8c]" />
              
              {t('Recent Lookups')}
            </h2>
            <Link
              to="/doctor/lookup"
              className="text-xs font-bold text-[#1f4e8c] hover:text-[#183f72] flex items-center gap-1 transition-colors"
            >
              
              {t('New Lookup')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1,2,3].map(i => <div key={i} className="skeleton h-14" />)}
            </div>
          ) : recentLookups.length > 0 ? (
            <div className="space-y-2">
              {recentLookups.slice(0, 6).map((a: any) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-2xl bg-[#f5f6f8] hover:bg-[#eceff3] transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#111]">
                      {a.messageKey ? t(a.messageKey, a.params) : a.description || a.details || t('Patient chart accessed')}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {new Date(a.createdAt).toLocaleString(getLocale())}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              
              {t('No patient lookups yet. Use the lookup tool to access patient charts.')}
            </div>
          )}
        </div>

        {/* Active Health Paths */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[#3a4556]" />
              
              {t('Active Treatment Plans')}
            </h2>
            <Link
              to="/doctor/health-paths"
              className="text-xs font-bold text-[#3a4556] hover:text-[#172030] flex items-center gap-1 transition-colors"
            >
              
              {t('View All')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}
            </div>
          ) : healthPaths.length > 0 ? (
            <div className="space-y-2">
              {healthPaths.slice(0, 5).map((hp: any) => (
                <div
                  key={hp._id}
                  className="p-3.5 rounded-2xl bg-[#eef1f5] hover:bg-[#e2e6ec] transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#111]">{hp.condition}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      
                      {t('Patient:')} <span className="text-[#3a4556] font-mono font-bold">{hp.patientId}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#3a4556] text-white shrink-0">
                    
                    {t('ACTIVE')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              
              {t('No active treatment plans. Look up a patient to create one.')}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Action Tiles ── */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-bold text-[#111] mb-5 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-[#1f4e8c]" />
          
          {t('Quick Actions')}
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/doctor/lookup" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#e9eff8] flex items-center justify-center group-hover:bg-[#1f4e8c] transition-colors">
              <Search className="w-5 h-5 text-[#1f4e8c] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Look Up Patient')}</p>
            <p className="text-[11px] text-slate-500">{t('Search by PAT-ID')}</p>
          </Link>
          <Link to="/doctor/health-paths" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#eef1f5] flex items-center justify-center group-hover:bg-[#3a4556] transition-colors">
              <HeartPulse className="w-5 h-5 text-[#3a4556] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Health Paths')}</p>
            <p className="text-[11px] text-slate-500">{t('Manage treatment plans')}</p>
          </Link>
          <Link to="/doctor/activity" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f6f8] flex items-center justify-center group-hover:bg-[#111] transition-colors">
              <Activity className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Access Log')}</p>
            <p className="text-[11px] text-slate-500">{t('Audit trail of chart views')}</p>
          </Link>
        </div>
      </div>

    </div>
  );
};
