import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronDown,
  Clock,
  FileStack,
  Fingerprint,
  HeartPulse,
  KeyRound,
  Languages,
  Lock,
  Route,
  ScrollText,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { HelixCanvas } from './landing/HelixCanvas.js';
import { Marquee, Orb, Reveal, ScrollWords, TiltCard } from './landing/fx.js';
import { useCountUp, useInView, useScrollProgress } from './landing/scrollFx.js';

/* ────────────────────────────── Hero ────────────────────────────── */

const Hero: React.FC = () => {
  const { t, tn } = useLanguage();
  const scroll = useRef(0);
  const ref = useScrollProgress<HTMLElement>('through', (p) => {
    // hero progress runs ~0.5 -> 1 while it scrolls away; normalise to 0..1 for the helix dissolve
    scroll.current = Math.max(0, (p - 0.5) * 2);
  });

  return (
    <section ref={ref} className="lp-grain relative min-h-[100svh] overflow-hidden" style={{ ['--p' as any]: 0.5 }}>
      <div className="lp-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="lp-grid absolute inset-0" aria-hidden="true" />

      {/* helix: right half on desktop, behind the copy on mobile */}
      <div
        className="absolute inset-y-0 right-[-10%] w-full lg:w-[62%] opacity-60 lg:opacity-100"
        style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -120px), 0)' }}
      >
        <HelixCanvas className="h-full w-full" scrollRef={scroll} />
      </div>

      <div
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 sm:px-8 pt-20 pb-28"
        style={{
          transform: 'translate3d(0, calc((var(--p) - 0.5) * -160px), 0)',
          opacity: 'calc(1 - (var(--p) - 0.5) * 1.6)',
        }}
      >
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            {t('Patient-Controlled Health Platform')}
          </span>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="lp-display mt-7 max-w-4xl text-[clamp(3rem,7.4vw,6.6rem)] font-medium text-[#0b0b12]">
            {tn('Your health, {records}', {
              records: (
                <span className="bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  {t('your records,')}
                </span>
              ),
            })}{' '}
            <span className="text-[#0b0b12]/35">{t('always in your hands.')}</span>
          </h1>
        </Reveal>

        <Reveal delay={260}>
          <p className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-[#4a4a5c]">
            {t('FollowUp brings your prescriptions, diagnostic reports, allergies, and treatment plans into one secure lifetime record — shared only with your explicit permission.')}
          </p>
        </Reveal>

        <Reveal delay={380} className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to="/patient/register"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#0b0b12] px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_-18px_rgba(40,30,120,.7)] transition hover:bg-violet-700"
          >
            {t('Get Your Patient ID Free')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/doctor/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0b0b12]/15 bg-white/60 px-7 py-4 text-sm font-semibold text-[#0b0b12] backdrop-blur transition hover:bg-white"
          >
            <Stethoscope className="h-4 w-4" /> {t('Doctor Portal Login')}
          </Link>
        </Reveal>

        <Reveal delay={480} className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-[#4a4a5c]">
          {[t('100% Free for Patients'), t('Instant Emergency HUD'), t('Zero Data Sold')].map((s) => (
            <span key={s} className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15 text-teal-700">
                <Check className="h-3 w-3" />
              </span>
              {s}
            </span>
          ))}
        </Reveal>
      </div>

      {/* floating glass data cards (desktop), each drifting at its own scroll speed */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden="true">
        <div
          className="lp-glass absolute right-[13%] top-[13%] w-60 rounded-3xl p-4"
          style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -260px), 0) rotate(-4deg)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">{t('Patient Identifier')}</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-tight text-[#0b0b12]">PAT-A892F1</p>
          <p className="mt-1 text-[11px] text-[#6b6b80]">{t('Blood Group: O+ • 29 yrs • Active Medical Record')}</p>
        </div>
        <div
          className="lp-glass absolute right-[3%] top-[46%] w-72 rounded-3xl p-4"
          style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -420px), 0) rotate(3deg)' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#0b0b12]">{t('Dr. Marcus Reed (Cardiology) • DOC-491B28')}</p>
              <p className="truncate text-[11px] text-[#6b6b80]">{t('Reason: Routine Follow-up Consultation')}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-full bg-[#0b0b12] py-1.5 text-center text-[11px] font-semibold text-white">{t('Approve')}</span>
            <span className="flex-1 rounded-full border border-[#0b0b12]/15 py-1.5 text-center text-[11px] font-semibold text-[#0b0b12]">{t('Deny')}</span>
          </div>
        </div>
        <div
          className="lp-glass absolute right-[19%] bottom-[9%] w-56 rounded-3xl p-4"
          style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -180px), 0) rotate(-2deg)' }}
        >
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-500">
            <HeartPulse className="h-3.5 w-3.5" /> {t('Heart rate')}
          </p>
          <div className="mt-1 flex items-end justify-between">
            <p className="lp-display text-4xl font-medium text-[#0b0b12]">
              72<span className="ml-1 text-sm font-normal text-[#6b6b80]">{t('bpm')}</span>
            </p>
            <svg viewBox="0 0 120 40" className="lp-ecg h-10 w-24" fill="none">
              <path d="M0 24 L30 24 L38 10 L46 34 L54 6 L62 28 L70 24 L120 24" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b80]">
        <span className="block">{t('Scroll to explore')}</span>
        <ChevronDown className="mx-auto mt-2 h-4 w-4 animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
};

/* ───────────────────────────── Mission ───────────────────────────── */

const Mission: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative mx-auto max-w-7xl px-5 sm:px-8 py-28 sm:py-40">
      <Orb className="right-[4%] top-10 h-28 w-28 sm:h-40 sm:w-40" />
      <Orb variant="teal" className="right-[22%] bottom-10 h-14 w-14 [animation-delay:-3s]" />
      <Reveal>
        <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Our mission')}</p>
      </Reveal>
      <ScrollWords
        className="lp-display max-w-5xl text-[clamp(1.9rem,4.4vw,4rem)] font-medium"
        text={t('We give every patient one lifelong medical record that they own, and every doctor exactly the part of it they need, only when the patient says yes.')}
      />
    </section>
  );
};

/* ────────────────────────────── Stats ────────────────────────────── */

const Stat: React.FC<{ value: number; suffix?: string; label: string; start: boolean; delay: number }> = ({
  value,
  suffix = '',
  label,
  start,
  delay,
}) => {
  const n = useCountUp(value, start, 1800 + delay);
  return (
    <div className="border-t border-[#0b0b12]/10 pt-6">
      <p className="lp-display text-[clamp(3.2rem,7vw,6rem)] font-medium tabular-nums text-[#0b0b12]">
        {n}
        <span className="text-violet-500">{suffix}</span>
      </p>
      <p className="mt-3 max-w-[16rem] text-sm leading-snug text-[#6b6b80]">{label}</p>
    </div>
  );
};

const Stats: React.FC = () => {
  const { t } = useLanguage();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-28">
      <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <Stat value={100} suffix="%" label={t('Patient-owned records')} start={inView} delay={0} />
        <Stat value={18} label={t('Medical specialties with scoped access')} start={inView} delay={150} />
        <Stat value={5} label={t('Languages, including Hindi, Kannada, Tamil and Telugu')} start={inView} delay={300} />
        <Stat value={0} label={t('Records ever sold')} start={inView} delay={450} />
      </div>
    </section>
  );
};

/* ───────────────────── How it works (pinned story) ───────────────────── */

const StepVisual: React.FC<{ step: number }> = ({ step }) => {
  const { t } = useLanguage();
  const layer = (i: number) =>
    `absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(.2,.7,.2,1)] ${
      step === i ? 'opacity-100 translate-y-0 scale-100' : step > i ? 'opacity-0 -translate-y-10 scale-95' : 'opacity-0 translate-y-10 scale-95'
    }`;
  return (
    <div className="relative h-[420px] sm:h-[480px] w-full">
      <Orb className="left-[6%] top-[8%] h-24 w-24" />
      <Orb variant="teal" className="right-[8%] bottom-[10%] h-16 w-16 [animation-delay:-4s]" />

      {/* 1. identity */}
      <div className={layer(0)} aria-hidden={step !== 0}>
        <div className="lp-glass w-[min(360px,90%)] rounded-[28px] p-6 rotate-[-3deg]">
          <div className="flex items-center justify-between">
            <Fingerprint className="h-6 w-6 text-violet-600" />
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700">{t('Patient Credential')}</span>
          </div>
          <p className="mt-10 text-[11px] uppercase tracking-wider text-[#6b6b80]">{t('Patient Identifier')}</p>
          <p className="font-mono text-3xl font-bold tracking-tight text-[#0b0b12]">PAT-A3F92B</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
            <div className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 transition-[width] duration-[1600ms] ${step === 0 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>
      </div>

      {/* 2. upload + auto-tag */}
      <div className={layer(1)} aria-hidden={step !== 1}>
        <div className="lp-glass w-[min(380px,92%)] rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#0b0b12]">{t('Complete Blood Count (CBC)')}</p>
              <p className="text-[11px] text-[#6b6b80]">{t('PDF Attached')}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[t('Blood Work'), t('Anemia'), t('General Practice')].map((tag, i) => (
              <span
                key={tag}
                className={`rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition-all duration-500 ${
                  step === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
                style={{ transitionDelay: `${300 + i * 180}ms` }}
              >
                <Sparkles className="mr-1 inline h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
            <Check className="h-3.5 w-3.5" /> {t('Verified ✓')}
          </p>
        </div>
      </div>

      {/* 3. consent request */}
      <div className={layer(2)} aria-hidden={step !== 2}>
        <div className="lp-glass w-[min(400px,94%)] rounded-[28px] p-6 rotate-[2deg]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0b0b12]">{t('Dr. Emily Chen (Orthopedic) • DOC-774A12')}</p>
              <p className="truncate text-[11px] text-[#6b6b80]">{t('Reason: Pre-Op Knee Evaluation')}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[t('24 hours'), t('7 days'), t('30 days')].map((d, i) => (
              <span
                key={d}
                className={`rounded-xl border py-2 text-center text-xs font-semibold ${
                  i === 1 ? 'border-violet-500 bg-violet-600 text-white' : 'border-[#0b0b12]/10 bg-white text-[#0b0b12]'
                }`}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <span className="flex-1 rounded-full bg-[#0b0b12] py-2.5 text-center text-xs font-semibold text-white">{t('Approve')}</span>
            <span className="flex-1 rounded-full border border-[#0b0b12]/15 py-2.5 text-center text-xs font-semibold text-[#0b0b12]">{t('Deny')}</span>
          </div>
        </div>
      </div>

      {/* 4. care plan progress */}
      <div className={layer(3)} aria-hidden={step !== 3}>
        <div className="lp-glass w-[min(400px,94%)] rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0b0b12]">{t('Post-Op Recovery & Rehab Plan')}</p>
              <p className="text-[11px] text-[#6b6b80]">{t('Prescribed by Dr. Emily Chen • 4-Week Path')}</p>
            </div>
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-800">{t('75% Complete')}</span>
          </div>
          <ol className="mt-5 space-y-2.5">
            {[t('Week 1 Mobility'), t('Meds Protocol'), t('Physical Therapy'), t('Final Check-in')].map((m, i) => (
              <li
                key={m}
                className={`flex items-center gap-3 text-sm transition-all duration-500 ${step === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i < 3 ? 'bg-teal-500 text-white' : 'border-2 border-[#0b0b12]/15'}`}>
                  {i < 3 && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={i < 3 ? 'text-[#0b0b12]' : 'text-[#6b6b80]'}>{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const steps = [
    { title: t('Create your unique PAT-ID'), body: t('Takes under 45 seconds. Receive your collision-free identifier (e.g. PAT-A3F92B) that stays with you for life.'), Icon: Fingerprint },
    { title: t('Upload & organize health documents'), body: t('Drag and drop prescriptions, lab scans, or blood work. Everything gets categorized and indexed.'), Icon: UploadCloud },
    { title: t('Approve or deny doctor requests'), body: t('When a physician needs access to your chart, they submit a reason. You grant or revoke access anytime.'), Icon: KeyRound },
    { title: t('Track your Health Paths & Recovery'), body: t('Follow physician-prescribed steps, check off milestone achievements, and stay on top of your health.'), Icon: Route },
  ];
  const ref = useScrollProgress<HTMLElement>('pin', (p) => {
    const next = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    setStep((s) => (s === next ? s : next));
  });

  return (
    <section ref={ref} className="relative h-[380vh]" style={{ ['--p' as any]: 0 }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Clear & Intuitive')}</p>
            <h2 className="lp-display mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-medium text-[#0b0b12]">{t('Designed for ease from day one')}</h2>

            {/* progress rail with dots, as in a stepper */}
            <div className="relative mt-10">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#0b0b12]/10" aria-hidden="true" />
              <div
                className="absolute left-[11px] top-2 w-px bg-gradient-to-b from-violet-500 to-teal-400 transition-[height] duration-500"
                style={{ height: `calc(${(step / (steps.length - 1)) * 100}% - 8px)` }}
                aria-hidden="true"
              />
              <ol className="space-y-6">
                {steps.map((s, i) => (
                  <li key={s.title} className="relative flex gap-5">
                    <span
                      className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                        i <= step ? 'border-violet-500 bg-violet-500 text-white' : 'border-[#0b0b12]/15 bg-[var(--lp-bg)] text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <div className={`transition-all duration-500 ${i === step ? 'opacity-100' : 'opacity-40'}`}>
                      <p className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[#0b0b12]">
                        <span className="font-mono text-xs text-violet-500">0{i + 1}</span>
                        {s.title}
                      </p>
                      <div className={`grid transition-all duration-500 ${i === step ? 'grid-rows-[1fr] mt-1.5' : 'grid-rows-[0fr]'}`}>
                        <p className="overflow-hidden text-sm leading-relaxed text-[#6b6b80] max-w-md">{s.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="hidden sm:block">
            <StepVisual step={step} />
          </div>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Advantages ───────────────────────────── */

const Advantages: React.FC = () => {
  const { t } = useLanguage();
  const cards = [
    { title: t('Unified Health Vault'), body: t('Upload prescriptions, lab reports, MRI scans, and discharge notes in seconds. Tagged, indexed, and available anywhere.'), chip: t('All Formats'), Icon: FileStack, orb: 'lilac' as const },
    { title: t('Unified Timeline'), body: t('Scroll through your entire medical journey chronologically. From early treatments to recent specialist reviews.'), chip: t('Chronological'), Icon: Clock, orb: 'teal' as const },
    { title: t('Consent-First Doctor Access'), body: t('Doctors must provide a valid clinical justification. You review, approve, or deny requests in real time.'), chip: t('Patient Controlled'), Icon: ShieldCheck, orb: 'lilac' as const },
    { title: t('Doctor-Prescribed Paths'), body: t('Clinicians establish clear recovery plans, medication schedules, and milestone checklists for continuous care.'), chip: t('Care Paths'), Icon: Route, orb: 'teal' as const },
    { title: t('Emergency Medical HUD'), body: t('Critical blood type, active medication list, and severe allergies surfaced instantly via emergency link without requiring login.'), chip: t('Zero Login'), Icon: Siren, orb: 'rose' as const },
    { title: t('Immutable Audit Trail'), body: t('Every record access, upload, and consultation note is logged with timestamps. Full transparency on who looked at your chart.'), chip: t('Audit Log'), Icon: ScrollText, orb: 'lilac' as const },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 py-28">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Platform Capabilities')}</p>
          <h2 className="lp-display mt-4 max-w-2xl text-[clamp(2.4rem,5vw,4.4rem)] font-medium text-[#0b0b12]">{t('Everything your medical history requires')}</h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="max-w-sm text-sm leading-relaxed text-[#6b6b80]">
            {t('A cohesive clinical ecosystem designed to replace scattered physical papers and stressful hospital record requests.')}
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={(i % 3) * 110}>
            <TiltCard className="group h-full overflow-hidden rounded-[28px] border border-white bg-white/70 p-7 shadow-[0_24px_60px_-34px_rgba(40,30,120,.35)] backdrop-blur">
              <Orb variant={c.orb} className="-right-8 -top-8 h-28 w-28 opacity-70 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <span className="rounded-full border border-[#0b0b12]/10 bg-white px-3 py-1 text-[10px] font-semibold text-[#0b0b12]">{c.chip}</span>
                <ArrowUpRight className="h-5 w-5 text-violet-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
              <c.Icon className="relative mt-10 h-7 w-7 text-violet-600" />
              <h3 className="relative mt-4 text-xl font-semibold tracking-tight text-[#0b0b12]">{c.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-[#6b6b80]">{c.body}</p>
              <p className="lp-display relative mt-8 text-[5.5rem] font-light leading-none text-[#0b0b12]/[0.07] transition-colors duration-500 group-hover:text-violet-500/20">
                0{i + 1}
              </p>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

/* ─────────────────── Horizontal showcase (dark, pinned) ─────────────────── */

const Showcase: React.FC = () => {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const ref = useScrollProgress<HTMLElement>('pin', (p) => {
    const track = trackRef.current;
    if (!track) return;
    const max = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.transform = `translate3d(${-p * max}px,0,0)`;
  });

  const panels = [
    {
      Icon: Stethoscope,
      kicker: t('Specialty-scoped access'),
      title: t('A cardiologist sees your heart, not your whole life.'),
      body: t('Every record is tagged by condition. Doctors see what matches their specialty; anything else needs your time-limited approval.'),
      art: (
        <div className="flex flex-wrap gap-2">
          {[t('Cardiology'), t('ECG'), t('Hypertension')].map((s) => (
            <span key={s} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">{s}</span>
          ))}
          <span className="rounded-full border border-dashed border-white/25 px-3 py-1.5 text-xs text-white/50">
            <Lock className="mr-1 inline h-3 w-3" />
            {t('Psychiatry')}
          </span>
        </div>
      ),
    },
    {
      Icon: Siren,
      kicker: t('Emergency Medical HUD'),
      title: t('Seconds matter. The essentials are one lookup away.'),
      body: t('Critical blood type, active medication list, and severe allergies surfaced instantly via emergency link without requiring login.'),
      art: (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-white/50">{t('🩸 Blood Group')}</p><p className="mt-1 font-semibold text-white">{t('O Positive (O+)')}</p></div>
          <div className="rounded-2xl bg-rose-500/20 p-3"><p className="text-rose-200">{t('⚠️ Allergies')}</p><p className="mt-1 font-semibold text-white">{t('Penicillin (Severe)')}</p></div>
        </div>
      ),
    },
    {
      Icon: BrainCircuit,
      kicker: t('AI health advisor'),
      title: t('Plain-language answers, any hour.'),
      body: t('Ask about symptoms or reports and get calm, practical guidance, with a clear nudge to see a doctor when it matters.'),
      art: (
        <div className="space-y-2 text-xs">
          <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-violet-500 px-3 py-2 text-white">{t('What does a high WBC count mean?')}</p>
          <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-white/85">{t('Usually your body is fighting an infection…')}</p>
        </div>
      ),
    },
    {
      Icon: Languages,
      kicker: t('Five languages'),
      title: t('Care in the language you think in.'),
      body: t('Every screen, message and report view works in English, Hindi, Kannada, Tamil and Telugu.'),
      art: (
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-white">
          {['English', 'हिन्दी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు'].map((l) => (
            <span key={l} className="rounded-full bg-white/10 px-3 py-1.5">{l}</span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section ref={ref} className="relative h-[340vh] bg-[#0b0b12] text-white" style={{ ['--p' as any]: 0 }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-40 top-10 h-[36rem] w-[36rem] rounded-full bg-violet-600/25 blur-[120px]" />
          <div className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-teal-500/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">{t('Why FollowUp')}</p>
          <h2 className="lp-display mt-3 max-w-3xl text-[clamp(2.2rem,4.6vw,4rem)] font-medium">{t('Built for how care actually works')}</h2>
        </div>
        <div ref={trackRef} className="relative mt-10 flex w-max gap-5 px-5 sm:px-8 will-change-transform lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {panels.map((p, i) => (
            <article
              key={p.kicker}
              className="flex w-[82vw] sm:w-[440px] shrink-0 flex-col justify-between rounded-[32px] border border-white/10 bg-white/[0.04] p-7 sm:p-8 backdrop-blur"
              style={{ minHeight: 'min(440px, 58svh)' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <p.Icon className="h-5 w-5 text-violet-200" />
                  </span>
                  <span className="font-mono text-xs text-white/40">0{i + 1} / 0{panels.length}</span>
                </div>
                <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">{p.kicker}</p>
                <h3 className="lp-display mt-3 text-[clamp(1.6rem,2.6vw,2.2rem)] font-medium">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
              <div className="mt-8">{p.art}</div>
            </article>
          ))}
          <div className="w-[10vw] shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Identity ───────────────────────────── */

const Identity: React.FC = () => {
  const { t } = useLanguage();
  const cards = [
    {
      label: t('Patient Identifier'), badge: t('Patient Credential'), id: 'PAT-XXXXXX', Icon: UserRound,
      tone: 'from-violet-500/15 to-transparent text-violet-700',
      points: [t('Given to doctors to request access to your records'), t('Publicly usable for emergency HUD scan'), t('Cannot be used in doctor portal')],
    },
    {
      label: t('Doctor Identifier'), badge: t('Clinical Credential'), id: 'DOC-XXXXXX', Icon: Stethoscope,
      tone: 'from-teal-500/15 to-transparent text-teal-700',
      points: [t('Issued upon clinician registration'), t('Attached to every access request for accountability'), t('Cannot be used in patient login portal')],
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 py-28 sm:py-36">
      <Reveal className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Identity Separation')}</p>
        <h2 className="lp-display mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-medium text-[#0b0b12]">{t('Two distinct ID formats for security')}</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#6b6b80]">{t('Patients and doctors use distinct identity schemes to prevent credential cross-contamination.')}</p>
      </Reveal>
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.id} delay={i * 150}>
            <TiltCard className={`h-full overflow-hidden rounded-[32px] border border-white bg-gradient-to-br ${c.tone} bg-white/70 p-8 shadow-[0_24px_60px_-34px_rgba(40,30,120,.35)]`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold"><c.Icon className="h-5 w-5" /> {c.label}</span>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#0b0b12]">{c.badge}</span>
              </div>
              <p className="lp-display mt-10 font-mono text-[clamp(2.4rem,5vw,3.6rem)] font-semibold text-[#0b0b12]">{c.id}</p>
              <ul className="mt-8 space-y-3">
                {c.points.map((pt, j) => (
                  <li key={pt} className="flex items-start gap-3 text-sm text-[#4a4a5c]">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${j === 2 ? 'bg-rose-100 text-rose-600' : 'bg-white text-teal-600'}`}>
                      {j === 2 ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

/* ────────────────────────────── Portals ────────────────────────────── */

const Portals: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-28">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Get Started')}</p>
        <h2 className="lp-display mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-medium text-[#0b0b12]">{t('Choose your portal')}</h2>
      </Reveal>
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {[
          { title: t('I am a Patient'), body: t('Own your medical timeline, grant doctor permissions, and access your emergency profile.'), primary: [t('Create Free Patient ID'), '/patient/register'], secondary: [t('Sign In to Patient Portal'), '/patient/login'], Icon: HeartPulse, orb: 'lilac' as const, dark: false },
          { title: t('I am a Doctor'), body: t('Request patient access, view full clinical charts, establish treatment plans, and log notes.'), primary: [t('Create Doctor Account'), '/doctor/register'], secondary: [t('Sign In to Doctor Portal'), '/doctor/login'], Icon: Stethoscope, orb: 'teal' as const, dark: true },
        ].map((p, i) => (
          <Reveal key={p.title} delay={i * 150}>
            <div className={`group relative h-full overflow-hidden rounded-[36px] p-9 sm:p-12 ${p.dark ? 'bg-[#0b0b12] text-white' : 'bg-white text-[#0b0b12]'} shadow-[0_30px_70px_-40px_rgba(40,30,120,.5)]`}>
              <Orb variant={p.orb} className="-right-10 -bottom-10 h-48 w-48 transition-transform duration-700 group-hover:scale-110 group-hover:-translate-y-2" />
              <p.Icon className={`relative h-8 w-8 ${p.dark ? 'text-teal-300' : 'text-violet-600'}`} />
              <h3 className="lp-display relative mt-8 text-4xl font-medium">{p.title}</h3>
              <p className={`relative mt-3 max-w-sm text-sm leading-relaxed ${p.dark ? 'text-white/60' : 'text-[#6b6b80]'}`}>{p.body}</p>
              <div className="relative mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  to={p.primary[1]}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition ${p.dark ? 'bg-white text-[#0b0b12] hover:bg-teal-100' : 'bg-[#0b0b12] text-white hover:bg-violet-700'}`}
                >
                  {p.primary[0]} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={p.secondary[1]}
                  className={`inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-sm font-semibold transition ${p.dark ? 'border-white/20 hover:bg-white/10' : 'border-[#0b0b12]/15 hover:bg-[#0b0b12]/5'}`}
                >
                  {p.secondary[0]}
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

/* ──────────────────────────────── FAQ ──────────────────────────────── */

const Faq: React.FC = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    [t('How does patient-controlled consent work on FollowUp?'), t('You own and hold your records. When a doctor wants to view your charts, they must submit a request with a clinical reason. You approve or deny instantly, and can revoke access anytime with one click.')],
    [t('What is the difference between my PAT-ID and a doctor’s DOC-ID?'), t('Patients receive collision-resistant PAT-XXXXXX IDs, while doctors receive verified DOC-XXXXXX IDs. The two namespaces never overlap, ensuring zero privilege escalation or portal confusion.')],
    [t('How do first responders access the Emergency HUD without logging in?'), t('First responders can look up your PAT-ID to view life-saving triage data (Blood Group, Severe Allergies, Emergency Contacts). No sensitive consultation notes are exposed without login, and all lookups are logged.')],
    [t('Can doctors view or download my medical records without my permission?'), t('No. Cryptographic role-based access control blocks all unauthorized queries. Without an active consent grant recorded by you, doctors cannot access your documents.')],
    [t('What are Doctor-Prescribed Health Paths?'), t('Health Paths are structured recovery and treatment roadmaps created by attending physicians. You can track and check off recovery milestones, giving your doctor real-time progress visibility.')],
    [t('How is my medical data encrypted and protected?'), t('All data is encrypted in transit using TLS 1.3 and encrypted at rest using AES-256 in compliance with HIPAA technical safeguards. We never sell or monetize your data.')],
  ];
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 py-28 lg:grid-cols-[1fr_1.4fr]">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">{t('Got Questions?')}</p>
        <h2 className="lp-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium text-[#0b0b12]">{t('Frequently Asked Questions')}</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#6b6b80]">{t('Learn how FollowUp keeps your healthcare records safe, universal, and strictly consent-controlled.')}</p>
        <Link to="/faq" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
          {t('View All FAQs with Search Filter')} <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
      <div className="divide-y divide-[#0b0b12]/10 border-y border-[#0b0b12]/10">
        {items.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <div key={q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="text-base sm:text-lg font-medium text-[#0b0b12]">{q}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0b0b12]/15 transition-transform duration-300 ${isOpen ? 'rotate-45 bg-[#0b0b12] text-white' : ''}`}>
                  <span className="text-xl leading-none">+</span>
                </span>
              </button>
              <div className={`grid transition-all duration-500 ${isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}>
                <p className="overflow-hidden text-sm leading-relaxed text-[#6b6b80] max-w-2xl">{a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ─────────────────────────────── Finale ─────────────────────────────── */

const Finale: React.FC = () => {
  const { t } = useLanguage();
  const ref = useScrollProgress<HTMLElement>('through');
  return (
    <section ref={ref} className="lp-grain relative overflow-hidden py-28 sm:py-40" style={{ ['--p' as any]: 0 }}>
      <div className="lp-aurora opacity-60" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <h2
        className="lp-display relative text-center text-[clamp(4rem,17vw,16rem)] font-medium uppercase text-[#0b0b12]"
        style={{ transform: 'translate3d(calc((0.5 - var(--p)) * 18vw), 0, 0)' }}
      >
        {t('Get Started')}
      </h2>
      <div
        className="relative z-10 mx-auto -mt-[clamp(2.5rem,8vw,7rem)] w-[min(560px,90%)]"
        style={{ transform: 'translate3d(0, calc((0.5 - var(--p)) * 80px), 0) rotate(calc((var(--p) - 0.5) * -6deg))' }}
      >
        <div className="rounded-[32px] bg-gradient-to-br from-violet-500 to-indigo-600 p-8 text-white shadow-[0_40px_80px_-30px_rgba(79,70,229,.7)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
            <Lock className="h-4 w-4" /> {t('End-to-End Encrypted')}
          </div>
          <p className="lp-display mt-4 text-3xl font-medium">{t('Your Privacy & Consent Are Fully Protected')}</p>
          <p className="mt-3 text-sm leading-relaxed text-violet-100/90">{t('Data is encrypted at rest and in transit. Doctors can only see records you explicitly authorize.')}</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/patient/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-indigo-700 transition hover:bg-violet-50">
              {t('Create Free ID')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/emergency" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold transition hover:bg-white/10">
              <Activity className="h-4 w-4" /> {t('Emergency Lookup')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────── Page ─────────────────────────────── */

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="lp-root overflow-x-clip">
      <Hero />
      <div className="border-y border-[#0b0b12]/10 bg-white/50 py-6 text-[#0b0b12]">
        <Marquee items={[t('Consent first'), t('Unified timeline'), t('Emergency ready'), t('Five languages'), t('Zero Data Sold')]} />
      </div>
      <Mission />
      <Stats />
      <HowItWorks />
      <Advantages />
      <Showcase />
      <div className="overflow-hidden py-10 text-[#0b0b12]">
        <Marquee reverse accent items={[t('Your health'), t('Your records'), t('Your consent'), t('Your timeline')]} />
      </div>
      <Identity />
      <Portals />
      <Faq />
      <Finale />
    </div>
  );
};

export default LandingPage;
