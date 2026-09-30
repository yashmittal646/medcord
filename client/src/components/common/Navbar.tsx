import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { IdentityBadge } from './IdentityBadge.js';
import {
  Activity,
  LogOut,
  Stethoscope,
  FileText,
  Clock,
  UserRound,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black/[0.07]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src="/logo.png"
                alt={t('FollowUp')}
                className="w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.4)' }}
              />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-0.5">
                Follow<span className="text-blue-600">Up</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                
                {t('Medical Records Platform')}
              </span>
            </div>
          </Link>

          {/* Authenticated nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {user.role === 'PATIENT' ? (
                <>
                  <Link
                    to="/patient/dashboard"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive('/patient/dashboard')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    
                    {t('Dashboard')}
                  </Link>
                  <Link
                    to="/patient/timeline"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/timeline')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />  {t('Timeline')}
                  </Link>
                  <Link
                    to="/patient/records"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/records')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />  {t('Records')}
                  </Link>
                  <Link
                    to="/patient/activity"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/activity')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />  {t('Privacy Feed')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/doctor/dashboard')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />  {t('Doctor Portal')}
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              /* Logged-in: show identity + logout */
              <div className="flex items-center gap-3 pl-2 border-l border-black/[0.07]">
                <IdentityBadge id={user.publicId} type={user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT'} size="sm" showLabel={false} />
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-[#111]">{user.name}</div>
                  <div className="text-[10px] text-[#999] font-mono">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title={t('Logout')}
                  className="p-1.5 text-[#aaa] hover:text-[#be3b2f] hover:bg-[#fdecea] rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Logged-out: one Sign In button; the sign-in box has the Patient / Doctor switch */
              <Link
                id="navbar-sign-in-btn"
                to="/patient/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#2a2a2a] text-white text-xs font-bold transition-all"
              >
                <UserRound className="w-3.5 h-3.5" />
                {t('Sign In')}
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
