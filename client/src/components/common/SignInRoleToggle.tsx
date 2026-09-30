import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HeartPulse, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

type Role = 'PATIENT' | 'DOCTOR';

const PATHS: Record<Role, string> = { PATIENT: '/patient/login', DOCTOR: '/doctor/login' };

/**
 * Patient / Doctor switch at the top of the sign-in box. Switching keeps whatever email was typed
 * (and any "return to" location) so nobody has to start over.
 */
export const SignInRoleToggle: React.FC<{ role: Role; email?: string }> = ({ role, email }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const go = (next: Role) => {
    if (next === role) return;
    navigate(PATHS[next], { replace: true, state: { ...(location.state as object | null), email } });
  };

  const options: { role: Role; label: string; Icon: React.ElementType; active: string }[] = [
    { role: 'PATIENT', label: t('Patient'), Icon: HeartPulse, active: 'text-blue-600' },
    { role: 'DOCTOR', label: t('Doctor'), Icon: Stethoscope, active: 'text-indigo-600' },
  ];

  return (
    <div role="tablist" aria-label={t('Sign in as')} className="relative mb-7 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
      {/* sliding highlight */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-300 ease-out ${
          role === 'DOCTOR' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {options.map(({ role: r, label, Icon, active }) => (
        <button
          key={r}
          type="button"
          role="tab"
          aria-selected={role === r}
          onClick={() => go(r)}
          className={`relative z-[1] flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-colors ${
            role === r ? active : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
};
