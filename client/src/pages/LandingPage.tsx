import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
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
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { HelixCanvas } from './landing/HelixCanvas.js';
import { AutoSlider, Marquee, Orb, Reveal, ScrollWords, TiltCard } from './landing/fx.js';
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
            <span className="lp-serif italic font-normal tracking-[-0.02em] text-[#0b0b12]/40">{t('always in your hands.')}</span>
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
    <section className="relative mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
      <Orb className="right-[3%] top-6 h-24 w-24 sm:h-36 sm:w-36" />
      <Orb variant="teal" className="right-[18%] bottom-6 h-12 w-12 [animation-delay:-3s]" />
      <Reveal>
        <p className="mb-6 lp-mono text-xs font-medium uppercase tracking-[0.22em] text-violet-600">{t('Our mission')}</p>
      </Reveal>
      <ScrollWords
        className="lp-serif max-w-6xl text-[clamp(2.6rem,6.6vw,6.25rem)] leading-[1.0] tracking-[-0.01em] [text-wrap:balance]"
        highlightEnd={0.4}
        text={t('Because your health deserves to be understood, not just recorded.')}
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
    <div>
      <p className="lp-grotesk text-[clamp(3rem,6vw,5.2rem)] font-medium leading-none tabular-nums text-[#2a2a36]">
        {n}
        <span className="text-violet-500">{suffix}</span>
      </p>
      <div className="mt-6 h-px w-4/5 bg-gradient-to-r from-[#0b0b12]/20 to-transparent" />
      <p className="mt-4 max-w-[15rem] text-[15px] leading-snug text-[#4a4a5c]">{label}</p>
    </div>
  );
};

// Four nested circles that all touch at one point (top right), each carrying a labelled dot
const RING_TANGENT = { x: 440, y: 60 };
const RING_DIR = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
const RINGS = [
  { r: 230, angle: 168 },
  { r: 178, angle: 104 },
  { r: 126, angle: 204 },
  { r: 74, angle: 146 },
].map(({ r, angle }) => {
  const cx = RING_TANGENT.x - RING_DIR.x * r;
  const cy = RING_TANGENT.y - RING_DIR.y * r;
  const a = (angle * Math.PI) / 180;
  return { r, cx, cy, dx: cx + r * Math.cos(a), dy: cy + r * Math.sin(a) };
});

const RingsFigure: React.FC<{ labels: string[]; inView: boolean }> = ({ labels, inView }) => (
  <div className={`relative mx-auto aspect-square w-full max-w-[440px] ${inView ? 'is-in' : ''}`}>
    <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="lp-ring-fill" cx="70%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      {RINGS.map((ring, i) => (
        <circle
          key={ring.r}
          className="lp-ring"
          cx={ring.cx}
          cy={ring.cy}
          r={ring.r}
          fill="url(#lp-ring-fill)"
          fillOpacity={0.55}
          stroke="#0b0b12"
          strokeOpacity={0.12}
          strokeWidth={1}
          style={{ transitionDelay: `${i * 180}ms` }}
        />
      ))}
    </svg>
    {RINGS.map((ring, i) => (
      <div
        key={ring.r}
        className="lp-ring-dot absolute flex items-start gap-2"
        style={{
          left: `${(ring.dx / 500) * 100}%`,
          top: `${(ring.dy / 500) * 100}%`,
          transitionDelay: `${900 + i * 200}ms`,
          transformOrigin: '0 0',
        }}
      >
        <span className="relative -ml-[5px] -mt-[5px] flex h-2.5 w-2.5 shrink-0">
          <span className="lp-ring-pulse absolute inset-0 rounded-full bg-violet-400" style={{ animationDelay: `${i * 0.5}s` }} />
          <span className="relative h-2.5 w-2.5 rounded-full bg-violet-500 ring-4 ring-violet-500/15" />
        </span>
        <span className="-mt-[9px] max-w-[8.5rem] text-[12px] sm:text-[13px] font-medium leading-tight text-[#2a2a36]">{labels[i]}</span>
      </div>
    ))}
  </div>
);

const Stats: React.FC = () => {
  const { t } = useLanguage();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-2">
      <div
        ref={ref}
        className="grid items-center gap-10 rounded-[36px] border border-white bg-white/55 p-7 sm:p-10 shadow-[0_30px_80px_-50px_rgba(40,30,120,.45)] backdrop-blur lg:grid-cols-[1fr_1.05fr]"
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-14">
          <Stat value={100} suffix="%" label={t('Patient-owned records')} start={inView} delay={0} />
          <Stat value={18} label={t('Medical specialties with scoped access')} start={inView} delay={150} />
          <Stat value={5} label={t('Languages, including Hindi, Kannada, Tamil and Telugu')} start={inView} delay={300} />
          <Stat value={0} label={t('Records ever sold')} start={inView} delay={450} />
        </div>
        <RingsFigure
          inView={inView}
          labels={[t('Patient-Controlled Data'), t('Secure Healthcare Platform'), t('Medication History'), t('Health Timeline')]}
        />
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
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden pt-20 sm:pt-24">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-violet-600">{t('Clear & Intuitive')}</p>
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
                      <p className="lp-grotesk flex items-center gap-2 text-base sm:text-lg font-semibold text-[#0b0b12]">
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

/* ───────────────────────── Feature strip (sliding) ───────────────────────── */

const FeatureStrip: React.FC = () => {
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
    <section className="relative border-y border-[#0b0b12]/10 bg-white/40 py-10 sm:py-12">
      <div className="mx-auto mb-8 flex max-w-7xl flex-col gap-2 px-5 sm:px-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-violet-600">{t('Platform Capabilities')}</p>
        <p className="lp-serif text-xl sm:text-2xl italic text-[#4a4a5c]">{t('Everything your medical history requires')}</p>
      </div>
      <AutoSlider>
        {cards.map((c, i) => (
          <TiltCard
            key={c.title}
            className="group relative w-[300px] sm:w-[360px] shrink-0 overflow-hidden rounded-[28px] border border-white bg-white/80 p-7 shadow-[0_24px_60px_-34px_rgba(40,30,120,.35)]"
          >
            <Orb variant={c.orb} className="-right-8 -top-8 h-28 w-28 opacity-70 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative flex items-center justify-between">
              <span className="rounded-full border border-[#0b0b12]/10 bg-white px-3 py-1 text-[10px] font-semibold text-[#0b0b12]">{c.chip}</span>
              <span className="lp-serif text-3xl italic leading-none text-violet-400/70">0{i + 1}</span>
            </div>
            <c.Icon className="relative mt-8 h-7 w-7 text-violet-600" />
            <h3 className="lp-grotesk relative mt-4 text-xl font-semibold text-[#0b0b12]">{c.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-[#6b6b80]">{c.body}</p>
          </TiltCard>
        ))}
      </AutoSlider>
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
          <p className="lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300">{t('Why FollowUp')}</p>
          <h2 className="lp-grotesk mt-3 max-w-3xl text-[clamp(2.2rem,4.6vw,4rem)] font-medium leading-[1.02]">{t('Built for how care actually works')}</h2>
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
                <h3 className="lp-serif mt-3 text-[clamp(1.8rem,2.8vw,2.5rem)] leading-[1.05]">{p.title}</h3>
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
        <p className="lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-violet-600">{t('Got Questions?')}</p>
        <h2 className="lp-serif mt-4 text-[clamp(2.6rem,5.4vw,4.4rem)] leading-[1.02] text-[#0b0b12]">{t('Frequently Asked Questions')}</h2>
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
                <span className="lp-grotesk text-base sm:text-lg font-medium text-[#0b0b12]">{q}</span>
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

/* ─────────────────────────────── Page ─────────────────────────────── */

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="lp-root overflow-x-clip">
      <Hero />
      <FeatureStrip />
      <Mission />
      <Stats />
      <HowItWorks />
      <Showcase />
      <div className="overflow-hidden py-10 text-[#0b0b12]">
        <Marquee reverse accent items={[t('Your health'), t('Your records'), t('Your consent'), t('Your timeline')]} />
      </div>
      <Faq />
    </div>
  );
};

export default LandingPage;
