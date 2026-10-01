import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { preloadPatientEntry } from '../../routes/pages.js';
import { SignInRoleToggle } from '../../components/common/SignInRoleToggle.js';
import { EcgBackground } from '../../components/common/EcgBackground.js';

export const PatientLogin: React.FC = () => {
  const { t, tn } = useLanguage();
  // the portal is the next screen: fetch its code while the form is being filled in
  useEffect(() => preloadPatientEntry(), []);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>((location.state as any)?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/patient/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await login({ email, password });
      if (data.user.role !== 'PATIENT') {
        logout();
        setError(t('This account is registered as a Doctor. Please use the Physician Portal to sign in.'));
        return;
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('Login failed. Please check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate min-h-[80vh] flex items-center justify-center px-4 py-12">
      <EcgBackground />
      <div className="glass-card max-w-md w-full p-8 relative border-slate-200/80 shadow-xl shadow-indigo-500/5 !bg-white/90 backdrop-blur-md">
        <SignInRoleToggle role="PATIENT" email={email} />

        <div className="text-center mb-8">
          <div className="ecg-heartbeat relative w-14 h-14 rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center mx-auto mb-3 shadow-md">
            <img
              src="/logo.png"
              alt={t('FollowUp Logo')}
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.4)' }}
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('Patient Sign In')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tn('Access your longitudinal medical records on {brand}', { brand: <span className="font-semibold text-slate-700">FollowUp</span> })}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('Email Address')}</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder={t('name@example.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('Password')}</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('Access Medical Portal')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          
          {t('Don\'t have a Patient ID yet?')}{' '}
          <Link to="/patient/register" className="text-blue-600 font-bold hover:underline">
            
            {t('Register Here')}
          </Link>
        </div>
      </div>
    </div>
  );
};
