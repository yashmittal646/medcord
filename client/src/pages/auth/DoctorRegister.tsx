import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { Mail, Lock, User, Building2, Award, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { preloadDoctorEntry } from '../../routes/pages.js';
import { SignInRoleToggle } from '../../components/common/SignInRoleToggle.js';
import { EcgBackground } from '../../components/common/EcgBackground.js';

export const DoctorRegister: React.FC = () => {
  const { t, tn } = useLanguage();
  // the portal is the next screen: fetch its code while the form is being filled in
  useEffect(() => preloadDoctorEntry(), []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'GENERAL_PRACTICE',
    licenseNumber: '',
    hospitalAffiliation: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredDoctorId, setRegisteredDoctorId] = useState<string | null>(null);

  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await registerDoctor(formData);
      setRegisteredDoctorId(res.user.publicId);
    } catch (err: any) {
      setError(err.message || t('Registration failed. Please check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredDoctorId) {
    return (
      <div className="relative isolate min-h-[80vh] flex items-center justify-center px-4 py-12">
        <EcgBackground />
        <div className="relative glass-card max-w-lg w-full p-8 text-center border-slate-200 shadow-xl !bg-white/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <CheckCircle2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('Physician Verification Registered!')}</h2>
          <p className="text-xs text-slate-600 mb-6">
            
            {t('Your clinical account is active. Here is your verified Doctor Identifier:')}
          </p>

          <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200 mb-6 flex flex-col items-center gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('Your Public Doctor ID')}</span>
            <IdentityBadge id={registeredDoctorId} type="DOCTOR" size="lg" showLabel={false} />
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              
              {t('Use this identifier on consultations, prescriptions, and active Health Path treatment courses.')}
            </p>
          </div>

          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{t('Proceed to Clinical Dashboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12">
      <EcgBackground />
      <div className="glass-card max-w-lg w-full p-8 relative border-slate-200/80 shadow-xl shadow-indigo-500/5 !bg-white/90 backdrop-blur-md">
        <SignInRoleToggle role="DOCTOR" mode="register" />

        <div className="text-center mb-6">
          <div className="ecg-heartbeat relative w-14 h-14 rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center mx-auto mb-3 shadow-md">
            <img
              src="/logo.png"
              alt={t('FollowUp Logo')}
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.4)' }}
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('Physician Registration')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tn('Register your credentials on {brand} for a {id} ID', { brand: <span className="font-semibold text-slate-700">FollowUp</span>, id: <span className="font-mono text-indigo-700 font-bold">DOC-XXXXXXXX</span> })}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('Doctor Full Name *')}</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                name="name"
                placeholder={t('Dr. Leonard McCoy')}
                value={formData.name}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('Work Email *')}</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  name="email"
                  placeholder={t('mccoy@hospital.org')}
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('Password *')}</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  name="password"
                  placeholder={t('Minimum 6 characters')}
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('Medical License Number *')}</label>
              <div className="relative flex items-center">
                <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  name="licenseNumber"
                  placeholder={t('MD-12345-US')}
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  className="w-full glass-input text-xs font-mono uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('Specialization')}</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full glass-input text-xs bg-white text-slate-800"
              >
                <option value="GENERAL_PRACTICE">{t('General Practice')}</option>
                <option value="CARDIOLOGY">{t('Cardiology')}</option>
                <option value="ENDOCRINOLOGY">{t('Endocrinology')}</option>
                <option value="NEPHROLOGY">{t('Nephrology')}</option>
                <option value="NEUROLOGY">{t('Neurology')}</option>
                <option value="DERMATOLOGY">{t('Dermatology')}</option>
                <option value="ONCOLOGY">{t('Oncology')}</option>
                <option value="ORTHOPEDICS">{t('Orthopedics')}</option>
                <option value="PSYCHIATRY">{t('Psychiatry')}</option>
                <option value="GASTROENTEROLOGY">{t('Gastroenterology')}</option>
                <option value="PULMONOLOGY">{t('Pulmonology')}</option>
                <option value="RADIOLOGY">{t('Radiology')}</option>
                <option value="OBGYN">{t('Obstetrics & Gynecology')}</option>
                <option value="ENT">{t('ENT')}</option>
                <option value="OPHTHALMOLOGY">{t('Ophthalmology')}</option>
                <option value="UROLOGY">{t('Urology')}</option>
                <option value="PEDIATRICS">{t('Pediatrics')}</option>
                <option value="EMERGENCY_MEDICINE">{t('Emergency Medicine')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('Hospital / Clinic Affiliation')}</label>
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="hospitalAffiliation"
                placeholder={t('Metro General Hospital')}
                value={formData.hospitalAffiliation}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md shadow-slate-900/20 hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('Register & Issue Doctor ID')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          
          {t('Already verified?')}{' '}
          <Link to="/doctor/login" className="text-indigo-600 font-bold hover:underline">
            
            {t('Physician Login')}
          </Link>
        </div>
      </div>
    </div>
  );
};
