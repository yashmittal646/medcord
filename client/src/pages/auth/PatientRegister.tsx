import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { IdentityBadge } from '../../components/common/IdentityBadge.js';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PatientRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'PREFER_NOT_TO_SAY',
    bloodGroup: 'UNKNOWN',
    emergencyContactName: '',
    emergencyContactRel: '',
    emergencyContactPhone: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatientId, setRegisteredPatientId] = useState<string | null>(null);

  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
      };

      if (formData.emergencyContactName && formData.emergencyContactPhone) {
        payload.emergencyContact = {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRel || 'Family',
          phone: formData.emergencyContactPhone,
        };
      }

      const res = await registerPatient(payload);
      setRegisteredPatientId(res.user.publicId);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPatientId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="glass-card max-w-lg w-full p-8 text-center border-slate-200 shadow-xl bg-white animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Complete!</h2>
          <p className="text-xs text-slate-600 mb-6">
            Your secure longitudinal health profile has been created. Here is your unique Patient ID:
          </p>

          <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 mb-6 flex flex-col items-center gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Your Public Identifier</span>
            <IdentityBadge id={registeredPatientId} type="PATIENT" size="lg" showLabel={false} />
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Give this ID to your doctors so they can locate your medical records and initiate Health Path treatments.
            </p>
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card max-w-lg w-full p-8 relative border-slate-200 shadow-lg bg-white">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center mx-auto mb-3 shadow-md">
            <img
              src="/logo.png"
              alt="FollowUp Logo"
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.4)' }}
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Patient Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join <span className="font-semibold text-slate-700">FollowUp</span> and receive your permanent <span className="font-mono text-blue-700 font-bold">PAT-XXXXXXXX</span> identifier
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                name="name"
                placeholder="Sarah Connor"
                value={formData.name}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="name@mail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1..."
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full glass-input text-xs bg-white text-slate-800 focus:border-blue-600"
              >
                <option value="UNKNOWN">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full glass-input text-xs bg-white text-slate-800 focus:border-blue-600"
              >
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-2">
              Emergency Contact (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="emergencyContactName"
                placeholder="Contact Name"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="glass-input text-xs col-span-1"
              />
              <input
                type="text"
                name="emergencyContactRel"
                placeholder="Relationship (e.g. Spouse)"
                value={formData.emergencyContactRel}
                onChange={handleChange}
                className="glass-input text-xs col-span-1"
              />
              <input
                type="tel"
                name="emergencyContactPhone"
                placeholder="Phone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="glass-input text-xs col-span-1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Generate My Patient ID</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/patient/login" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
