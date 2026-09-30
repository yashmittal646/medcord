import React, { useRef } from 'react';
import { useInView, usePrefersReducedMotion, useScrollProgress, useScrollVelocity } from './scrollFx.js';

/** Fades and lifts its children in when scrolled into view */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  y?: number;
}> = ({ children, delay = 0, className = '', as = 'div', y = 28 }) => {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={`lp-reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ['--ry' as any]: `${y}px` }}
    >
      {children}
    </Tag>
  );
};

/**
 * Endless horizontal band of words. Drifts on its own and speeds up (or reverses) with scroll velocity,
 * alternating solid and outlined words like a ticker.
 */
export const Marquee: React.FC<{ items: string[]; reverse?: boolean; className?: string; accent?: boolean }> = ({
  items,
  reverse = false,
  className = '',
  accent = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ x: 0, boost: 0, raf: 0, last: 0 });

  useScrollVelocity((v) => {
    state.current.boost = Math.max(-40, Math.min(40, state.current.boost + v * 0.35));
  });

  React.useEffect(() => {
    if (reduced) return;
    const s = state.current;
    const tick = (now: number) => {
      const dt = s.last ? Math.min(50, now - s.last) : 16;
      s.last = now;
      const track = trackRef.current;
      if (track) {
        const half = track.scrollWidth / 2;
        const dir = reverse ? 1 : -1;
        s.x += dir * (0.045 * dt) + dir * s.boost * 0.35;
        s.boost *= 0.92;
        if (half > 0) {
          if (s.x <= -half) s.x += half;
          if (s.x > 0) s.x -= half;
        }
        track.style.transform = `translate3d(${s.x}px,0,0)`;
      }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [reduced, reverse]);

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === 'b'}>
      {items.map((word, i) => (
        <span key={`${key}-${i}`} className="flex items-center">
          <span className={`lp-marquee-word ${i % 2 === 1 ? (accent ? 'text-violet-400' : 'lp-outline') : ''}`}>{word}</span>
          <span className="mx-6 sm:mx-10 inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-current text-base opacity-40">
            +
          </span>
          <span className="mr-6 sm:mr-10 text-4xl sm:text-6xl font-light opacity-30">/</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
};

/**
 * A single row of cards gliding across the screen in an endless loop. Scroll velocity nudges it along,
 * and hovering eases it to a stop so a card can be read.
 */
export const AutoSlider: React.FC<{ children: React.ReactNode; className?: string; speed?: number }> = ({
  children,
  className = '',
  speed = 0.05,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ x: 0, boost: 0, raf: 0, last: 0, rate: 1, target: 1 });

  useScrollVelocity((v) => {
    state.current.boost = Math.max(-30, Math.min(30, state.current.boost + Math.abs(v) * 0.25));
  });

  React.useEffect(() => {
    if (reduced) return;
    const s = state.current;
    const tick = (now: number) => {
      const dt = s.last ? Math.min(50, now - s.last) : 16;
      s.last = now;
      s.rate += (s.target - s.rate) * 0.08;
      const track = trackRef.current;
      if (track) {
        const half = track.scrollWidth / 2;
        s.x -= (speed * dt + s.boost * 0.3) * s.rate;
        s.boost *= 0.92;
        if (half > 0 && s.x <= -half) s.x += half;
        track.style.transform = `translate3d(${s.x}px,0,0)`;
      }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [reduced, speed]);

  return (
    <div
      className={`relative select-none ${reduced ? 'overflow-x-auto' : 'overflow-hidden'} ${className}`}
      onPointerEnter={() => (state.current.target = 0)}
      onPointerLeave={() => (state.current.target = 1)}
      style={{
        maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      }}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <div className="flex shrink-0 gap-5 pr-5">{children}</div>
        {!reduced && (
          <div className="flex shrink-0 gap-5 pr-5" aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

/** A paragraph whose words darken one by one as it scrolls through the viewport */
export const ScrollWords: React.FC<{ text: string; className?: string; highlightEnd?: number }> = ({
  text,
  className = '',
  highlightEnd = 0.55,
}) => {
  const words = text.split(/\s+/).filter(Boolean);
  const ref = useScrollProgress<HTMLParagraphElement>('through');
  return (
    <p ref={ref} className={`lp-scrollwords ${className}`} style={{ ['--p' as any]: 0 }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{ ['--i' as any]: i / words.length, ['--end' as any]: highlightEnd }}
          className="lp-word"
        >
          {w}{' '}
        </span>
      ))}
    </p>
  );
};

/** Iridescent glass "molecule" orb (pure CSS) */
export const Orb: React.FC<{ className?: string; variant?: 'lilac' | 'teal' | 'rose' }> = ({ className = '', variant = 'lilac' }) => (
  <div className={`lp-orb lp-orb-${variant} ${className}`} aria-hidden="true">
    <span className="lp-orb-shine" />
  </div>
);

/** Card that tilts toward the pointer in 3D */
export const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`lp-tilt ${className}`}>
      {children}
    </div>
  );
};
