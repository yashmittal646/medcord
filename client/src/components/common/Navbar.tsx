import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { IdentityBadge } from './IdentityBadge.js';
import {
  Activity,
  HeartPulse,
  LogOut,
  Stethoscope,
  FileText,
  Clock,
  ChevronDown,
  UserRound,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black/[0.07]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center">
              <HeartPulse className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                Med<span className="text-blue-600">Cord</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Medical Records Platform
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
                    Dashboard
                  </Link>
                  <Link
                    to="/patient/timeline"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/timeline')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Timeline
                  </Link>
                  <Link
                    to="/patient/records"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/records')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Records
                  </Link>
                  <Link
                    to="/patient/activity"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive('/patient/activity')
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Privacy Feed
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
                    <Stethoscope className="w-3.5 h-3.5" /> Doctor Portal
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
                  title="Logout"
                  className="p-1.5 text-[#aaa] hover:text-[#be3b2f] hover:bg-[#fdecea] rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Logged-out: single Sign In button with dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  id="navbar-sign-in-btn"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#2a2a2a] text-white text-xs font-bold transition-all"
                >
                  <UserRound className="w-3.5 h-3.5" />
                  Sign In
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-[fadeSlideDown_0.15s_ease-out]">
                    {/* Patient */}
                    <div className="p-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3 pt-1 pb-2">Patient</p>
                      <Link
                        to="/patient/login"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <HeartPulse className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Sign In</div>
                          <div className="text-[10px] text-slate-500">Access your records</div>
                        </div>
                      </Link>
                      <Link
                        to="/patient/register"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <UserRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Create Account</div>
                          <div className="text-[10px] text-slate-500">Get your Patient ID</div>
                        </div>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 p-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3 pt-1 pb-2">Doctor</p>
                      <Link
                        to="/doctor/login"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Doctor Sign In</div>
                          <div className="text-[10px] text-slate-500">Access clinical portal</div>
                        </div>
                      </Link>
                      <Link
                        to="/doctor/register"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                          <UserRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Register</div>
                          <div className="text-[10px] text-slate-500">Get your Doctor ID</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
