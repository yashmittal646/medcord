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
  Users,
  Clock,
} from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';

export const DoctorDashboard: React.FC = () => {
  const { t, tn } = useLanguage();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5 page-enter">

      {/* ── Hero Banner (dark card) ── */}
      <div className="card-dark p-7 sm:p-9">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[#a0a0a0] text-sm font-medium mb-1">
              {new Date().toLocaleDateString(getLocale(), { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {tn('Welcome back, {name}', { name: <span className="text-[#5eead4]">{t('Dr. {name}', { name: user?.name })}</span> })}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <IdentityBadge id={user?.publicId || ''} type="DOCTOR" size="md" showLabel={false} />
              {doctorProfile?.specialization && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#5eead4]/15 text-[#5eead4] border border-[#5eead4]/30">
                  {enumLabel(doctorProfile.specialization)}
                  {doctorProfile.hospitalAffiliation ? ` · ${doctorProfile.hospitalAffiliation}` : ''}
                </span>
              )}
              <p className="text-[#888] text-xs font-medium">{t('Clinical Command Portal · Patient Chart Access & Health Paths')}</p>
            </div>
          </div>

          {/* Quick Lookup */}
          <form onSubmit={handleQuickLookup} className="flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder={t('PAT-XXXXXX lookup')}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value.toUpperCase())}
              className="text-sm w-48 font-mono uppercase px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-[#5eead4]/60 focus:bg-white/15 transition-all"
              id="quick-lookup-input"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#5eead4] hover:bg-[#4dd6c0] text-[#111] font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              
              {t('Search')}
            </button>
          </form>
        </div>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Patients Today — big dark-accent */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[110px] border-l-4 border-[#0c8b77]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#e3f4f0] flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-[#0c8b77]" />
            </div>
            <span className="text-4xl font-extrabold text-[#111] tracking-tight leading-none">
              {isLoading ? <span className="skeleton w-10 h-9 inline-block" /> : todayActivity}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#555] mt-3">{t('Patients Accessed Today')}</p>
        </div>

        {/* Active Paths */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[110px] border-l-4 border-[#6d3ec8]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#f1eafb] flex items-center justify-center">
              <HeartPulse className="w-4.5 h-4.5 text-[#6d3ec8]" />
            </div>
            <span className="text-4xl font-extrabold text-[#111] tracking-tight leading-none">
              {isLoading ? <span className="skeleton w-10 h-9 inline-block" /> : healthPaths.length}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#555] mt-3">{t('Active Treatment Plans')}</p>
        </div>

        {/* Total Lookups */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[110px] border-l-4 border-[#c86a0a]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#fdf0e0] flex items-center justify-center">
              <Eye className="w-4.5 h-4.5 text-[#c86a0a]" />
            </div>
            <span className="text-4xl font-extrabold text-[#111] tracking-tight leading-none">
              {isLoading ? <span className="skeleton w-10 h-9 inline-block" /> : recentLookups.length}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#555] mt-3">{t('Total Chart Lookups')}</p>
        </div>
      </div>

      {/* ── Main Content: 2 columns ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Patient Lookups */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0c8b77]" />
              
              {t('Recent Lookups')}
            </h2>
            <Link
              to="/doctor/lookup"
              className="text-xs font-bold text-[#0c8b77] hover:text-[#0a7566] flex items-center gap-1 transition-colors"
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
                  className="p-3.5 rounded-2xl bg-[#f6f4f0] hover:bg-[#f0ede7] transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#111]">
                      {a.messageKey ? t(a.messageKey, a.params) : a.description || a.details || t('Patient chart accessed')}
                    </p>
                    <p className="text-[11px] text-[#999] font-mono mt-0.5">
                      {new Date(a.createdAt).toLocaleString(getLocale())}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-[#bbb] shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-[#bbb]">
              
              {t('No patient lookups yet. Use the lookup tool to access patient charts.')}
            </div>
          )}
        </div>

        {/* Active Health Paths */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[#6d3ec8]" />
              
              {t('Active Treatment Plans')}
            </h2>
            <Link
              to="/doctor/health-paths"
              className="text-xs font-bold text-[#6d3ec8] hover:text-[#5d34b8] flex items-center gap-1 transition-colors"
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
                  className="p-3.5 rounded-2xl bg-[#f1eafb] hover:bg-[#ebe2f8] transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#111]">{hp.condition}</p>
                    <p className="text-[11px] text-[#777] mt-0.5">
                      
                      {t('Patient:')} <span className="text-[#6d3ec8] font-mono font-bold">{hp.patientId}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#6d3ec8] text-white shrink-0">
                    
                    {t('ACTIVE')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-[#bbb]">
              
              {t('No active treatment plans. Look up a patient to create one.')}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Action Tiles ── */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-bold text-[#111] mb-5 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-[#0c8b77]" />
          
          {t('Quick Actions')}
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/doctor/lookup" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#e3f4f0] flex items-center justify-center group-hover:bg-[#0c8b77] transition-colors">
              <Search className="w-5 h-5 text-[#0c8b77] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Look Up Patient')}</p>
            <p className="text-[11px] text-[#999]">{t('Search by PAT-ID')}</p>
          </Link>
          <Link to="/doctor/health-paths" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#f1eafb] flex items-center justify-center group-hover:bg-[#6d3ec8] transition-colors">
              <HeartPulse className="w-5 h-5 text-[#6d3ec8] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Health Paths')}</p>
            <p className="text-[11px] text-[#999]">{t('Manage treatment plans')}</p>
          </Link>
          <Link to="/doctor/activity" className="action-tile group">
            <div className="w-10 h-10 rounded-2xl bg-[#f6f4f0] flex items-center justify-center group-hover:bg-[#111] transition-colors">
              <Activity className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-[#111]">{t('Access Log')}</p>
            <p className="text-[11px] text-[#999]">{t('Audit trail of chart views')}</p>
          </Link>
        </div>
      </div>

    </div>
  );
};
