import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
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

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
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

  const stats = [
    {
      label: 'Patients Accessed Today',
      value: activity.filter((a) => {
        const today = new Date().toDateString();
        return new Date(a.createdAt).toDateString() === today;
      }).length,
      Icon: Users,
      color: 'text-emerald-700',
      bg: 'border-emerald-200 bg-emerald-50/70',
    },
    {
      label: 'Active Health Paths',
      value: healthPaths.length,
      Icon: HeartPulse,
      color: 'text-teal-700',
      bg: 'border-teal-200 bg-teal-50/70',
    },
    {
      label: 'Total Chart Lookups',
      value: recentLookups.length,
      Icon: Eye,
      color: 'text-sky-700',
      bg: 'border-sky-200 bg-sky-50/70',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Banner */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 bg-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-xl text-emerald-700">
                {user?.name?.charAt(0) || 'D'}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dr. {user?.name}
                </h1>
                <IdentityBadge id={user?.publicId || ''} type="DOCTOR" size="md" showLabel={false} />
              </div>
              <p className="text-xs text-slate-500">
                Clinical Command Portal — Controlled longitudinal patient chart access & Health Paths
              </p>
            </div>
          </div>

          {/* Quick Lookup */}
          <form onSubmit={handleQuickLookup} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="PAT-XXXXXX quick lookup"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value.toUpperCase())}
              className="glass-input text-sm w-52 font-mono uppercase"
              id="quick-lookup-input"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className={`glass-card p-6 border ${bg} shadow-xs`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className={`text-3xl font-extrabold ${color}`}>{isLoading ? '—' : value}</span>
            </div>
            <p className="text-xs text-slate-700 font-bold">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Patient Lookups */}
        <div className="glass-card p-6 sm:p-7 border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Recent Patient Lookups
            </h2>
            <Link
              to="/doctor/lookup"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              New Lookup <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : recentLookups.length > 0 ? (
            <div className="space-y-2.5">
              {recentLookups.slice(0, 6).map((a: any) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {a.description || a.details || 'Patient chart accessed'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No patient lookups yet. Use the lookup tool to access patient charts.
            </div>
          )}
        </div>

        {/* Active Health Paths */}
        <div className="glass-card p-6 sm:p-7 border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              Active Treatment Plans
            </h2>
            <Link
              to="/doctor/health-paths"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : healthPaths.length > 0 ? (
            <div className="space-y-2.5">
              {healthPaths.slice(0, 5).map((hp: any) => (
                <div
                  key={hp._id}
                  className="p-3.5 rounded-xl bg-teal-50/40 border border-teal-200 flex items-start justify-between gap-3 shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{hp.condition}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient: <span className="text-teal-700 font-mono font-bold">{hp.patientId}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No active treatment plans. Look up a patient to create one.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 sm:p-7 border-slate-200 bg-white shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-emerald-600" />
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            to="/doctor/lookup"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 transition-all text-center group shadow-xs"
          >
            <Search className="w-6 h-6 text-emerald-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-emerald-900">Look Up Patient</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Search by PAT-ID with consent</p>
          </Link>
          <Link
            to="/doctor/health-paths"
            className="p-4 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100/80 transition-all text-center group shadow-xs"
          >
            <HeartPulse className="w-6 h-6 text-teal-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-teal-900">Manage Health Paths</p>
            <p className="text-[11px] text-slate-500 mt-0.5">View active treatment plans</p>
          </Link>
          <Link
            to="/doctor/activity"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-center group shadow-xs"
          >
            <Activity className="w-6 h-6 text-slate-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-900">My Access Log</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Audit trail of your chart views</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
