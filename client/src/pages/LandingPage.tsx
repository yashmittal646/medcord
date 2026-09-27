import React from 'react';
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
  Eye,
  Star,
  TrendingUp,
  FolderOpen,
  ClipboardList,
} from 'lucide-react';

/* ─── tiny animated counter ─── */
const StatCard: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <div className="flex flex-col items-center gap-1">
    <span className={`text-4xl font-extrabold tracking-tight ${color}`}>{value}</span>
    <span className="text-sm text-slate-500 font-medium text-center">{label}</span>
  </div>
);

/* ─── feature pill ─── */
const FeaturePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
    {icon}
    {text}
  </div>
);

/* ─── big feature card ─── */
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  tags?: string[];
}> = ({ icon, title, description, accentBg, accentText, accentBorder, tags }) => (
  <div className="glass-card-hover p-7 flex flex-col gap-4 group">
    <div className={`w-12 h-12 rounded-2xl ${accentBg} border ${accentBorder} flex items-center justify-center ${accentText} shadow-sm`}>
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
    {tags && (
      <div className="flex flex-wrap gap-2 mt-auto pt-2">
        {tags.map((t) => (
          <span key={t} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${accentBg} ${accentText} border ${accentBorder}`}>
            {t}
          </span>
        ))}
      </div>
    )}
  </div>
);

/* ─── step card ─── */
const StepCard: React.FC<{ num: number; title: string; body: string; color: string }> = ({ num, title, body, color }) => (
  <div className="relative flex gap-5">
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center text-base font-extrabold shadow-md shrink-0`}>
        {num}
      </div>
      {num < 4 && <div className="w-0.5 flex-1 bg-slate-200 mt-2 mb-0" />}
    </div>
    <div className="pb-10">
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Soft ambient blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-teal-100/40 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-100/20 blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* badge row */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <FeaturePill icon={<Shield className="w-3.5 h-3.5" />} text="Patient-Controlled" />
            <FeaturePill icon={<Lock className="w-3.5 h-3.5" />} text="Consent-First" />
            <FeaturePill icon={<Clock className="w-3.5 h-3.5" />} text="Full Longitudinal History" />
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-7">
            Your health,{' '}
            <span className="gradient-text-cyan">your records,</span>
            <br />
            your control.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            AsyncHealth brings together every prescription, lab result, scan, and consultation into
            one secure longitudinal record — shared only when <em>you</em> say so.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              to="/patient/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-glow-cyan transition-all duration-200 hover:scale-[1.02]"
            >
              <HeartPulse className="w-5 h-5" />
              Create Your Patient ID
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/doctor/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-base shadow-sm transition-all duration-200 hover:scale-[1.02]"
            >
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Doctor Portal
            </Link>
          </div>

          {/* trust strip */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-xs text-slate-500 font-medium">
            {[
              { icon: <CheckCircle className="w-4 h-4 text-teal-500" />, label: 'No data sold — ever' },
              { icon: <CheckCircle className="w-4 h-4 text-teal-500" />, label: 'Full audit trail on every access' },
              { icon: <CheckCircle className="w-4 h-4 text-teal-500" />, label: 'Emergency snapshots in seconds' },
              { icon: <CheckCircle className="w-4 h-4 text-teal-500" />, label: 'Unique collision-free Patient IDs' },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">{icon}{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATS BANNER ══════════ */}
      <section className="border-y border-slate-200 bg-gradient-to-r from-teal-50/60 via-white to-emerald-50/60 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-10">
          <StatCard value="100%" label="Patient-approved access" color="text-teal-600" />
          <StatCard value="0s"   label="Emergency lookup time" color="text-rose-500" />
          <StatCard value="∞"    label="Records in your timeline" color="text-emerald-600" />
          <StatCard value="1"    label="Unified ID for life" color="text-sky-600" />
        </div>
      </section>

      {/* ══════════ FEATURES GRID ══════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">What we offer</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything your health journey needs</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              One platform. Every stakeholder. Built around consent, clarity, and clinical care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FolderOpen className="w-6 h-6" />}
              title="Unified Health Records"
              description="Upload prescriptions, lab reports, diagnostic scans, and consultation notes. Every document timestamped and categorised into one clean timeline."
              accentBg="bg-teal-50" accentText="text-teal-700" accentBorder="border-teal-200"
              tags={['Prescriptions', 'Lab reports', 'Scans']}
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Longitudinal Timeline"
              description="Scroll through your entire health history in chronological order — from first GP visit to latest specialist review — in a single beautiful feed."
              accentBg="bg-emerald-50" accentText="text-emerald-700" accentBorder="border-emerald-200"
              tags={['Chronological', 'Searchable', 'Filterable']}
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6" />}
              title="Doctor-Prescribed Health Paths"
              description="Physicians create structured treatment plans — medication schedules, lifestyle goals, follow-ups. Patients track and mark milestones as they complete them."
              accentBg="bg-sky-50" accentText="text-sky-700" accentBorder="border-sky-200"
              tags={['Treatment plans', 'Milestones', 'Progress']}
            />
            <FeatureCard
              icon={<UserCheck className="w-6 h-6" />}
              title="Consent-First Doctor Access"
              description="Doctors request access with a clinical reason. You approve or deny — instantly. Access can be revoked at any time. No silent backdoors."
              accentBg="bg-purple-50" accentText="text-purple-700" accentBorder="border-purple-200"
              tags={['Approve / Deny', 'Revoke anytime', 'Reason required']}
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6" />}
              title="Full Audit Activity Log"
              description="Every record view, access request, upload, and prescription is permanently logged. You see exactly who looked at your data and when."
              accentBg="bg-amber-50" accentText="text-amber-700" accentBorder="border-amber-200"
              tags={['Immutable log', 'Who & when', 'Total transparency']}
            />

          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-24 bg-slate-50/80 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple from day one</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              Get set up in minutes. No bureaucracy, no fax machines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-20 gap-y-0">
            {/* Patient flow */}
            <div>
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-teal-600 text-white text-xs font-bold uppercase tracking-wide">
                <HeartPulse className="w-3.5 h-3.5" /> For Patients
              </div>
              <StepCard num={1} color="bg-teal-600" title="Register & get your unique PAT-ID" body="Takes under 60 seconds. You receive a collision-resistant identifier like PAT-A3F92B that stays with you for life." />
              <StepCard num={2} color="bg-teal-500" title="Upload your health records" body="Drag and drop prescriptions, lab reports, or scan PDFs. Tag them by type for instant search later." />
              <StepCard num={3} color="bg-teal-400" title="Approve doctor requests" body="When a doctor needs your chart they send a request with a reason. You decide — approve, deny, or revoke." />
              <StepCard num={4} color="bg-teal-300" title="Track your Health Paths" body="Mark milestone steps on your treatment plan as complete. Stay on top of your recovery journey in real time." />
            </div>

            {/* Doctor flow */}
            <div>
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide">
                <Stethoscope className="w-3.5 h-3.5" /> For Doctors
              </div>
              <StepCard num={1} color="bg-emerald-600" title="Register your DOC-ID" body="Doctors receive a distinct DOC-XXXXXXXX identifier, fully separate from patient IDs, to prevent any identity confusion." />
              <StepCard num={2} color="bg-emerald-500" title="Search patients by ID" body="Look up any patient using their public PAT-ID and send an access request explaining your clinical reason." />
              <StepCard num={3} color="bg-emerald-400" title="Access approved records" body="Once the patient approves, you view their full timeline — records, medications, allergies, conditions, and history." />
              <StepCard num={4} color="bg-emerald-300" title="Create Health Paths & consult" body="Prescribe structured treatment plans, log consultations, and track patient progress — all in one place." />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ID EXPLAINER ══════════ */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">Identity system</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Two distinct IDs, zero confusion</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              Patients and doctors are issued different ID formats, so the right people always access the right portals.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="glass-card p-8 border-teal-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-5">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div className="font-mono text-3xl font-extrabold text-teal-700 mb-3">PAT-A3F92B</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Patient ID</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {['Issued on first registration', 'Shared with doctors who need chart access', 'Required for emergency HUD lookup', 'Globally unique — collision resistant'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-8 border-emerald-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="font-mono text-3xl font-extrabold text-emerald-700 mb-3">DOC-9B7E41</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Doctor ID</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {['Issued on doctor registration', 'Distinct prefix (DOC-) from PAT-', 'Used to log all record access events', 'Cannot be used in patient login portal'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ WHAT PATIENTS CAN DO ══════════ */}
      <section className="py-24 bg-gradient-to-b from-teal-50/60 to-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Patient powers</p>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                You are in complete<br />control of your data.
              </h2>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">
                AsyncHealth flips the script on traditional EMR systems. Instead of a hospital owning your records,
                you own them. Share what you want, with whom you want, for as long as you want.
              </p>
              <Link
                to="/patient/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-glow-cyan transition-all hover:scale-[1.02]"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <FolderOpen className="w-5 h-5" />, title: 'Upload Records', body: 'Drag & drop any medical document' },
                { icon: <Eye className="w-5 h-5" />, title: 'Control Access', body: 'Approve or deny every doctor' },
                { icon: <ClipboardList className="w-5 h-5" />, title: 'Track Health Paths', body: 'Mark milestones as done' },
                { icon: <TrendingUp className="w-5 h-5" />, title: 'View Timeline', body: 'Full chronological history' },
                { icon: <Bell className="w-5 h-5" />, title: 'Audit Log', body: 'See every access event' },
                { icon: <FileText className="w-5 h-5" />, title: 'Manage Meds', body: 'Track active medications' },
              ].map(({ icon, title, body }) => (
                <div key={title} className="glass-card p-4 flex flex-col gap-2 hover:border-teal-300 transition-colors">
                  <div className="text-teal-600">{icon}</div>
                  <div className="text-sm font-bold text-slate-900">{title}</div>
                  <div className="text-xs text-slate-500">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ WHAT DOCTORS CAN DO ══════════ */}
      <section className="py-24 bg-gradient-to-b from-emerald-50/60 to-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1 grid grid-cols-2 gap-4">
              {[
                { icon: <FolderOpen className="w-5 h-5" />, title: 'Find Patients', body: 'Search by PAT-ID instantly' },
                { icon: <UserCheck className="w-5 h-5" />, title: 'Request Access', body: 'Submit clinical reason for review' },
                { icon: <Eye className="w-5 h-5" />, title: 'Full Chart View', body: 'Complete records once approved' },
                { icon: <Activity className="w-5 h-5" />, title: 'Health Paths', body: 'Create & manage treatment plans' },
                { icon: <FileText className="w-5 h-5" />, title: 'Log Consultations', body: 'Record every clinical encounter' },
                { icon: <Star className="w-5 h-5" />, title: 'View Allergies', body: 'Critical flags always visible' },
              ].map(({ icon, title, body }) => (
                <div key={title} className="glass-card p-4 flex flex-col gap-2 hover:border-emerald-300 transition-colors">
                  <div className="text-emerald-600">{icon}</div>
                  <div className="text-sm font-bold text-slate-900">{title}</div>
                  <div className="text-xs text-slate-500">{body}</div>
                </div>
              ))}
            </div>

            <div className="order-1 md:order-2">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Doctor powers</p>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Better clinical<br />decisions, faster.
              </h2>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">
                No more chasing paper records or calling previous hospitals. With patient consent, access the full
                longitudinal chart — allergies, conditions, medications, lab history — in seconds.
              </p>
              <Link
                to="/doctor/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-glow-emerald transition-all hover:scale-[1.02]"
              >
                Register as Doctor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DUAL PORTAL CARDS ══════════ */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Get started now</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Choose your portal</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Patient card */}
            <div className="glass-card-hover p-8 border-teal-200 text-center flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                <HeartPulse className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">I'm a Patient</h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto">
                  Manage your personal health records, control who sees them, and track your treatment progress.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 mt-2">
                <Link
                  to="/patient/register"
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-glow-cyan transition-all hover:scale-[1.01] text-center"
                >
                  Create Account
                </Link>
                <Link
                  to="/patient/login"
                  className="w-full py-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-sm border border-teal-200 transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Doctor card */}
            <div className="glass-card-hover p-8 border-emerald-200 text-center flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">I'm a Doctor</h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto">
                  Access patient-approved records, prescribe treatment paths, log consultations, and manage clinical care.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 mt-2">
                <Link
                  to="/doctor/register"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-glow-emerald transition-all hover:scale-[1.01] text-center"
                >
                  Create Account
                </Link>
                <Link
                  to="/doctor/login"
                  className="w-full py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200 transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-teal-700 font-extrabold text-lg">
              <HeartPulse className="w-5 h-5" />
              AsyncHealth
            </div>
            <div className="flex gap-6 text-xs text-slate-500 font-medium">
              <Link to="/patient/login" className="hover:text-teal-600 transition-colors">Patient Login</Link>
              <Link to="/doctor/login" className="hover:text-emerald-600 transition-colors">Doctor Login</Link>
              <Link to="/patient/register" className="hover:text-teal-600 transition-colors">Register</Link>
            </div>
            <p className="text-xs text-slate-400">
              © 2026 AsyncHealth. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
