import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext.js';
import { IdentityBadge } from '../common/IdentityBadge.js';
import { LanguagePickerModal } from '../common/LanguagePickerModal.js';
import {
  LayoutDashboard,
  User,
  FileText,
  Clock,
  HeartPulse,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquareHeart,
  Globe,
} from 'lucide-react';

export const PatientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, t, showPicker } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const patientNav = [
    { to: '/patient/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
    { to: '/patient/profile', label: t('nav.medicalProfile'), Icon: User },
    { to: '/patient/records', label: t('nav.medicalRecords'), Icon: FileText },
    { to: '/patient/timeline', label: t('nav.timeline'), Icon: Clock },
    { to: '/patient/health-paths', label: t('nav.healthPaths'), Icon: HeartPulse },
    { to: '/patient/ask-advice', label: t('nav.askAdvice'), Icon: MessageSquareHeart },
    { to: '/patient/activity', label: t('nav.privacyFeed'), Icon: Shield },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Language Picker Modal (triggered on first visit or when user clicks language pill) */}
      <LanguagePickerModal
        isOpen={showPicker || modalOpen}
        onClose={() => setModalOpen(false)}
        isDismissable={!showPicker}
      />

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
        <div className="p-5 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-blue-600">
                {user?.name?.charAt(0) || 'P'}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <IdentityBadge id={user?.publicId || ''} type="PATIENT" size="sm" showLabel={false} />
            </div>
            <button
              className="ml-auto lg:hidden p-1 text-slate-400 hover:text-slate-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language Switcher Pill */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLang.label}</span>
              <span className="text-[10px] text-slate-400">({currentLang.labelEn})</span>
            </div>
            <span className="text-xs">{currentLang.flag}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{t('nav.patientPortal')}</p>
          {patientNav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            {t('nav.signOut')}
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
          <span className="text-sm font-bold text-slate-800">{t('nav.patientPortal')}</span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <Globe className="w-3 h-3 text-blue-600" />
            <span>{currentLang.code.toUpperCase()}</span>
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
