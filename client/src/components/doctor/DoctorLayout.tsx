import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { IdentityBadge } from '../common/IdentityBadge.js';
import {
  LayoutDashboard,
  Search,
  HeartPulse,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/doctor/lookup', label: 'Patient Lookup', Icon: Search },
  { to: '/doctor/health-paths', label: 'Health Paths', Icon: HeartPulse },
  { to: '/doctor/activity', label: 'My Activity Log', Icon: Shield },
];

export const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-300 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shrink-0 shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-emerald-700">
                {user?.name?.charAt(0) || 'D'}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <IdentityBadge id={user?.publicId || ''} type="DOCTOR" size="sm" showLabel={false} />
            </div>
            <button
              className="ml-auto lg:hidden p-1 text-slate-400 hover:text-slate-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Clinical Portal
          </p>
          {doctorNav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Emergency HUD — visually separated */}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-3 mb-2">
              Emergency
            </p>
            <NavLink
              to="/doctor/emergency"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-rose-600' : 'text-rose-400 group-hover:text-rose-600'
                    }`}
                  />
                  <span className="flex-1">Emergency HUD</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-600" />}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-800">Doctor Portal</span>
          <IdentityBadge id={user?.publicId || ''} type="DOCTOR" size="sm" showLabel={false} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
