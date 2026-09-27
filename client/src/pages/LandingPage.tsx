import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  HeartPulse,
  Stethoscope,
  Clock,
  Lock,
  Activity,
  ArrowRight,
  FileText,
  CheckCircle,
  UserCheck,
  Bell,
  Zap,
  ShieldCheck,
  ChevronRight,
  Check,
  Award,
} from 'lucide-react';

/* ─── Stat card with trustworthy clinical styling ─── */
const StatCard: React.FC<{
  value: string;
  label: string;
  subtext: string;
  icon: React.ReactNode;
  accentColor: string;
  bgLight: string;
}> = ({ value, label, subtext, icon, accentColor, bgLight }) => (
  <div
    className="bg-white rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
    style={{
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
    }}
  >
    <div className="flex items-center justify-between">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{ background: bgLight, color: accentColor }}
      >
        {icon}
      </div>
      <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: accentColor }}>
        {value}
      </span>
    </div>
    <div>
      <div className="text-base font-bold text-slate-900">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>
    </div>
  </div>
);

/* ─── Feature card ─── */
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
}> = ({ icon, title, description, iconBg, iconColor, badgeText, badgeBg, badgeColor }) => (
  <div
    className="bg-white rounded-2xl p-7 flex flex-col gap-4 group transition-all duration-200 hover:-translate-y-1"
    style={{
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.08)';
      (e.currentTarget as HTMLElement).style.borderColor = '#BFDBFE';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px -4px rgba(15, 23, 42, 0.04)';
      (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
    }}
  >
    <div className="flex items-center justify-between">
      <div className="w-13 h-13 rounded-2xl flex items-center justify-center p-3.5 shadow-sm" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <span
        className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
        style={{ background: badgeBg, color: badgeColor }}
      >
        {badgeText}
      </span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

/* ─── Step item ─── */
const StepItem: React.FC<{
  num: number;
  title: string;
  body: string;
  badge: string;
  color: string;
  bgLight: string;
  isLast?: boolean;
}> = ({ num, title, body, badge, color, bgLight, isLast }) => (
  <div className="relative flex gap-5">
    <div className="flex flex-col items-center">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0"
        style={{ background: bgLight, color: color, border: `2px solid ${color}40` }}
      >
        0{num}
      </div>
      {!isLast && <div className="w-0.5 flex-1 my-3 rounded-full bg-slate-200" />}
    </div>
    <div className="pb-8 pt-0.5">
      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
        <h4 className="text-base font-bold text-slate-900">{title}</h4>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: bgLight, color: color }}>
          {badge}
        </span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [activeHeroTab, setActiveHeroTab] = useState<'timeline' | 'consent' | 'emergency' | 'path'>('timeline');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ══════════ TOP ALERT BAR (Clean Navy & Blue) ══════════ */}
      <div className="bg-slate-900 text-slate-200 py-2.5 px-4 text-xs font-semibold text-center tracking-wide flex items-center justify-center gap-2 border-b border-slate-800">
        <ShieldCheck className="w-4 h-4 text-blue-400" />
        <span>100% Patient-Owned Longitudinal Health Records • Instant Consent Revocation & Emergency Access</span>
        <Link to="/patient/register" className="underline font-bold text-blue-300 hover:text-white ml-2 inline-flex items-center gap-1">
          Create Free ID <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
        
        {/* Subtle, clean top ambient illumination */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] pointer-events-none rounded-[40px] opacity-40"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(219, 234, 254, 0.8) 0%, rgba(241, 245, 249, 0.4) 50%, transparent 100%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 bg-white border border-slate-200 text-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Patient-Controlled Health Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-6">
              Your health,{' '}
              <span className="text-blue-600">
                your records,
              </span>
              <br />
              always in your hands.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
              MedCord brings your prescriptions, diagnostic reports, allergies, and treatment plans into one secure lifetime record — shared only with your explicit permission.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                to="/patient/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all duration-150 hover:-translate-y-0.5"
              >
                <HeartPulse className="w-5 h-5 text-blue-200" />
                Get Your Patient ID Free
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/doctor/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-bold text-base text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-150 hover:-translate-y-0.5"
              >
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Doctor Portal Login
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="flex flex-wrap items-center justify-center gap-y-2.5 gap-x-8 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>100% Free for Patients</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Instant Emergency HUD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Zero Data Sold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Immutable Audit History</span>
              </div>
            </div>

          </div>

          {/* ══════════ LIVE INTERACTIVE PREVIEW CARD ══════════ */}
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xl shadow-slate-900/5 transition-all"
            >
              {/* Card Window Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">Sarah Jenkins</span>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        PAT-A892F1
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">Blood Group: O+ • 29 yrs • Active Medical Record</span>
                  </div>
                </div>

                {/* Interactive tab selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setActiveHeroTab('timeline')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeHeroTab === 'timeline'
                        ? 'bg-white text-blue-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Timeline
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('consent')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeHeroTab === 'consent'
                        ? 'bg-white text-indigo-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Consents
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('emergency')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeHeroTab === 'emergency'
                        ? 'bg-white text-rose-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Emergency HUD
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('path')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeHeroTab === 'path'
                        ? 'bg-white text-slate-900 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Health Path
                  </button>
                </div>
              </div>

              {/* Dynamic Tab Body */}
              <div className="pt-5">
                {activeHeroTab === 'timeline' && (
                  <div className="grid sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                          Prescription
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">Amoxicillin 500mg</h4>
                        <p className="text-xs text-slate-600 mt-1">Prescribed by Dr. Marcus Reed for acute bronchitis.</p>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-3 flex items-center justify-between">
                        <span>2 days ago</span>
                        <span className="font-semibold text-blue-600">Verified ✓</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                          Lab Report
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">Complete Blood Count (CBC)</h4>
                        <p className="text-xs text-slate-600 mt-1">WBC: 6.8 • Hemoglobin: 14.2 g/dL (Normal Range)</p>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-3 flex items-center justify-between">
                        <span>1 week ago</span>
                        <span className="font-semibold text-indigo-600">PDF Attached</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          Consultation
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">Cardiology Review</h4>
                        <p className="text-xs text-slate-600 mt-1">Normal rhythm. Scheduled 6-month routine follow-up.</p>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-3 flex items-center justify-between">
                        <span>3 weeks ago</span>
                        <span className="font-semibold text-amber-700">Dr. Sharma</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'consent' && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          DR
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Dr. Marcus Reed (Cardiology) • DOC-491B28</div>
                          <div className="text-[11px] text-slate-500">Reason: Routine Follow-up Consultation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                          Active Access ✓
                        </span>
                        <button className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1">
                          Revoke
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          DR
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Dr. Emily Chen (Orthopedic) • DOC-774A12</div>
                          <div className="text-[11px] text-slate-500">Reason: Pre-Op Knee Evaluation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg">
                          Approve
                        </button>
                        <button className="text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded-lg">
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'emergency' && (
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 grid sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-rose-100">
                      <span className="text-[11px] font-bold text-rose-600 uppercase">🩸 Blood Group</span>
                      <div className="text-xl font-black text-slate-900 mt-1">O Positive (O+)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-rose-100">
                      <span className="text-[11px] font-bold text-amber-600 uppercase">⚠️ Allergies</span>
                      <div className="text-sm font-bold text-slate-900 mt-1">Penicillin (Severe)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-rose-100">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">📞 Emergency Contact</span>
                      <div className="text-sm font-bold text-slate-900 mt-1">David (Spouse): +1 555-0192</div>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'path' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900">Post-Op Recovery & Rehab Plan</span>
                        <div className="text-[11px] text-slate-500">Prescribed by Dr. Emily Chen • 4-Week Path</div>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                        75% Complete
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Check className="w-3.5 h-3.5 text-blue-600" /> Week 1 Mobility
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Check className="w-3.5 h-3.5 text-blue-600" /> Meds Protocol
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Check className="w-3.5 h-3.5 text-blue-600" /> Physical Therapy
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 flex items-center gap-1.5 text-blue-900 font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Final Check-in
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════ KEY METRICS ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            value="100%"
            label="Patient-Approved"
            subtext="Zero unauthorized doctor access"
            icon={<ShieldCheck className="w-6 h-6" />}
            accentColor="#2563EB"
            bgLight="#EFF6FF"
          />
          <StatCard
            value="< 2s"
            label="Emergency Lookup"
            subtext="Immediate access to vital allergies & blood type"
            icon={<Zap className="w-6 h-6" />}
            accentColor="#E11D48"
            bgLight="#FFE4E6"
          />
          <StatCard
            value="Lifetime"
            label="Unified Timeline"
            subtext="Chronological archive of all consultations"
            icon={<Clock className="w-6 h-6" />}
            accentColor="#4F46E5"
            bgLight="#EEF2FF"
          />
          <StatCard
            value="1 ID"
            label="Collision-Free"
            subtext="PAT-ID & DOC-ID strict role separation"
            icon={<Award className="w-6 h-6" />}
            accentColor="#D97706"
            bgLight="#FEF3C7"
          />
        </div>
      </section>

      {/* ══════════ WHAT WE OFFER ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Everything your medical history requires
          </h2>
          <p className="text-base text-slate-600">
            A cohesive clinical ecosystem designed to replace scattered physical papers and stressful hospital record requests.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Unified Health Vault"
            description="Upload prescriptions, lab reports, MRI scans, and discharge notes in seconds. Tagged, indexed, and available anywhere."
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            badgeText="All Formats"
            badgeBg="#DBEAFE"
            badgeColor="#1D4ED8"
          />

          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Longitudinal Timeline"
            description="Scroll through your entire medical journey chronologically. From early treatments to recent specialist reviews."
            iconBg="#EEF2FF"
            iconColor="#4F46E5"
            badgeText="Chronological"
            badgeBg="#E0E7FF"
            badgeColor="#3730A3"
          />

          <FeatureCard
            icon={<Activity className="w-6 h-6" />}
            title="Doctor-Prescribed Paths"
            description="Clinicians establish clear recovery plans, medication schedules, and milestone checklists for continuous care."
            iconBg="#F0FDF4"
            iconColor="#166534"
            badgeText="Care Paths"
            badgeBg="#DCFCE7"
            badgeColor="#15803D"
          />

          <FeatureCard
            icon={<UserCheck className="w-6 h-6" />}
            title="Consent-First Doctor Access"
            description="Doctors must provide a valid clinical justification. You review, approve, or deny requests in real time."
            iconBg="#F8FAFC"
            iconColor="#0F172A"
            badgeText="Patient Controlled"
            badgeBg="#E2E8F0"
            badgeColor="#334155"
          />

          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Emergency Medical HUD"
            description="Critical blood type, active medication list, and severe allergies surfaced instantly via emergency link without requiring login."
            iconBg="#FFE4E6"
            iconColor="#E11D48"
            badgeText="Zero Login"
            badgeBg="#FFF1F2"
            badgeColor="#BE123C"
          />

          <FeatureCard
            icon={<Bell className="w-6 h-6" />}
            title="Immutable Audit Trail"
            description="Every record access, upload, and consultation note is logged with timestamps. Full transparency on who looked at your chart."
            iconBg="#FEF3C7"
            iconColor="#D97706"
            badgeText="Audit Log"
            badgeBg="#FFFBEB"
            badgeColor="#B45309"
          />
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl p-8 sm:p-14 border border-slate-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 mb-3">
              Clear & Intuitive
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Designed for ease from day one
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Straightforward workflows built for both patients and clinicians.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Patient Flow */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-600 text-white shadow-sm">
                <HeartPulse className="w-4 h-4 text-blue-100" /> Patient Experience
              </div>

              <StepItem
                num={1}
                title="Create your unique PAT-ID"
                body="Takes under 45 seconds. Receive your collision-free identifier (e.g. PAT-A3F92B) that stays with you for life."
                badge="Instant Setup"
                color="#2563EB"
                bgLight="#EFF6FF"
              />
              <StepItem
                num={2}
                title="Upload & organize health documents"
                body="Drag and drop prescriptions, lab scans, or blood work. Everything gets categorized and indexed."
                badge="Drag & Drop"
                color="#0284C7"
                bgLight="#E0F2FE"
              />
              <StepItem
                num={3}
                title="Approve or deny doctor requests"
                body="When a physician needs access to your chart, they submit a reason. You grant or revoke access anytime."
                badge="Granular Consent"
                color="#4F46E5"
                bgLight="#EEF2FF"
              />
              <StepItem
                num={4}
                title="Track your Health Paths & Recovery"
                body="Follow physician-prescribed steps, check off milestone achievements, and stay on top of your health."
                badge="Care Progress"
                color="#0F172A"
                bgLight="#F1F5F9"
                isLast
              />
            </div>

            {/* Doctor Flow */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-900 text-white shadow-sm">
                <Stethoscope className="w-4 h-4 text-blue-300" /> Doctor Experience
              </div>

              <StepItem
                num={1}
                title="Register your verified DOC-ID"
                body="Physicians receive a dedicated DOC-XXXXXX identifier, strictly separated from patient credentials."
                badge="Verified ID"
                color="#0F172A"
                bgLight="#F1F5F9"
              />
              <StepItem
                num={2}
                title="Search patient by PAT-ID & request access"
                body="Quickly lookup the patient and provide clinical justification for chart inspection."
                badge="Clinical Reason"
                color="#2563EB"
                bgLight="#EFF6FF"
              />
              <StepItem
                num={3}
                title="Review longitudinal clinical chart"
                body="View allergies, conditions, active medications, past surgeries, and lab history in one view."
                badge="Full Overview"
                color="#4F46E5"
                bgLight="#EEF2FF"
              />
              <StepItem
                num={4}
                title="Prescribe Health Paths & record consults"
                body="Create structured recovery roadmaps, log encounter notes, and coordinate follow-up appointments."
                badge="Care Plans"
                color="#D97706"
                bgLight="#FEF3C7"
                isLast
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ID ARCHITECTURE CARD ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 mb-3">
            Identity Separation
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Two distinct ID formats for security
          </h2>
          <p className="text-sm text-slate-600">
            Patients and doctors use distinct identity schemes to prevent credential cross-contamination.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Patient ID Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 uppercase">
                Patient Identifier
              </span>
            </div>
            <div className="font-mono text-3xl font-black text-slate-900 mb-2">PAT-XXXXXX</div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Credential</h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0 font-bold" />
                <span>Given to doctors to request access to your records</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Publicly usable for emergency HUD scan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Cannot be used in doctor portal</span>
              </li>
            </ul>
          </div>

          {/* Doctor ID Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 uppercase">
                Doctor Identifier
              </span>
            </div>
            <div className="font-mono text-3xl font-black text-slate-900 mb-2">DOC-XXXXXX</div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Clinical Credential</h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Issued upon clinician registration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Attached to every access request for accountability</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Cannot be used in patient login portal</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════ CHOOSE YOUR PORTAL (CTA) ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            Get Started
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Choose your portal
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Patient Card */}
          <div
            className="bg-white rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1"
            style={{
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div className="w-18 h-18 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 p-4">
              <HeartPulse className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">I am a Patient</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-xs">
              Own your medical timeline, grant doctor permissions, and access your emergency profile.
            </p>

            <div className="flex flex-col w-full gap-3">
              <Link
                to="/patient/register"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all text-center"
              >
                Create Free Patient ID
              </Link>
              <Link
                to="/patient/login"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-center"
              >
                Sign In to Patient Portal
              </Link>
            </div>
          </div>

          {/* Doctor Card */}
          <div
            className="bg-white rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1"
            style={{
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
            }}
          >
            <div className="w-18 h-18 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-6 p-4">
              <Stethoscope className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">I am a Doctor</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-xs">
              Request patient access, view full clinical charts, establish treatment plans, and log notes.
            </p>

            <div className="flex flex-col w-full gap-3">
              <Link
                to="/doctor/register"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all text-center"
              >
                Create Doctor Account
              </Link>
              <Link
                to="/doctor/login"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-center"
              >
                Sign In to Doctor Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQS SECTION ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Learn how MedCord keeps your healthcare records safe, universal, and strictly consent-controlled.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4 mb-8">
          {[
            {
              q: 'How does patient-controlled consent work on MedCord?',
              a: 'You own and hold your records. When a doctor wants to view your charts, they must submit a request with a clinical reason. You approve or deny instantly, and can revoke access anytime with one click.',
            },
            {
              q: 'What is the difference between my PAT-ID and a doctor’s DOC-ID?',
              a: 'Patients receive collision-resistant PAT-XXXXXX IDs, while doctors receive verified DOC-XXXXXX IDs. The two namespaces never overlap, ensuring zero privilege escalation or portal confusion.',
            },
            {
              q: 'How do first responders access the Emergency HUD without logging in?',
              a: 'First responders can look up your PAT-ID to view life-saving triage data (Blood Group, Severe Allergies, Emergency Contacts). No sensitive consultation notes are exposed without login, and all lookups are logged.',
            },
            {
              q: 'Can doctors view or download my medical records without my permission?',
              a: 'No. Cryptographic role-based access control blocks all unauthorized queries. Without an active consent grant recorded by you, doctors cannot access your documents.',
            },
            {
              q: 'What are Doctor-Prescribed Health Paths?',
              a: 'Health Paths are structured recovery and treatment roadmaps created by attending physicians. You can track and check off recovery milestones, giving your doctor real-time progress visibility.',
            },
            {
              q: 'How is my medical data encrypted and protected?',
              a: 'All data is encrypted in transit using TLS 1.3 and encrypted at rest using AES-256 in compliance with HIPAA technical safeguards. We never sell or monetize your data.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-200 transition-all"
            >
              <h4 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                {item.q}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-4.5">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All FAQs with Search Filter <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ══════════ SECURITY ASSURANCE BANNER ══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-12 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Your Privacy & Consent Are Fully Protected</h4>
              <p className="text-sm text-slate-300 mt-1">
                Data is encrypted at rest and in transit. Doctors can only see records you explicitly authorize.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-sm">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              End-to-End Encrypted
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
