import React, { useEffect, useRef } from 'react';

/**
 * Soft ECG-monitor backdrop: faint grid paper plus slow heartbeat traces. A glowing sweep travels along
 * each trace (head bright, tail fading) the way a bedside monitor redraws. Purely decorative.
 */

const VIEW_W = 1200;
const BASE = 50;
const BEAT_W = 300;

/** One P-QRS-T complex per 300 units, flat between beats */
function beatPath(beats: number, amp: number) {
  let d = `M0,${BASE}`;
  for (let i = 0; i < beats; i++) {
    const x = i * BEAT_W;
    d +=
      ` L${x + 96},${BASE}` +
      ` Q${x + 110},${BASE - 7 * amp} ${x + 124},${BASE}` + // P wave
      ` L${x + 142},${BASE}` +
      ` L${x + 148},${BASE + 5 * amp}` + // Q
      ` L${x + 157},${BASE - 42 * amp}` + // R
      ` L${x + 166},${BASE + 16 * amp}` + // S
      ` L${x + 174},${BASE}` +
      ` L${x + 196},${BASE}` +
      ` Q${x + 218},${BASE - 12 * amp} ${x + 240},${BASE}` + // T wave
      ` L${x + BEAT_W},${BASE}`;
  }
  return d;
}

interface Trace {
  top: string;
  color: string;
  /** seconds for the sweep to cross the screen (4 beats) */
  duration: number;
  delay: number;
  amp: number;
  opacity: number;
}

const TRACES: Trace[] = [
  { top: '14%', color: '#6366f1', duration: 7.2, delay: 0, amp: 0.9, opacity: 0.8 },
  { top: '52%', color: '#14b8a6', duration: 8.4, delay: -3.1, amp: 1.1, opacity: 0.75 },
  { top: '84%', color: '#8b5cf6', duration: 7.8, delay: -5.6, amp: 0.8, opacity: 0.7 },
];

// Layered dashes share one moving head: longer + fainter layers form the fading tail
const LAYERS = [
  { len: 0.38, width: 1.6, alpha: 0.28 },
  { len: 0.18, width: 2.2, alpha: 0.55 },
  { len: 0.05, width: 2.6, alpha: 0.9 },
  { len: 0.008, width: 5, alpha: 1 },
];
const TRAVEL = 1.4; // head runs from 0 to 1.4 so the tail fully leaves before the next sweep

const TraceLine: React.FC<{ trace: Trace; reduced: boolean }> = ({ trace, reduced }) => {
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const d = beatPath(VIEW_W / BEAT_W, trace.amp);

  useEffect(() => {
    if (reduced) return;
    const anims = refs.current.map((el, i) => {
      if (!el || typeof el.animate !== 'function') return null;
      const { len } = LAYERS[i];
      return el.animate([{ strokeDashoffset: len }, { strokeDashoffset: len - TRAVEL }], {
        duration: trace.duration * 1000,
        delay: trace.delay * 1000,
        iterations: Infinity,
        easing: 'linear',
      });
    });
    return () => anims.forEach((a) => a?.cancel());
  }, [reduced, trace.duration, trace.delay]);

  return (
    <svg
      className="absolute left-0 w-full h-24 sm:h-28 -translate-y-1/2"
      style={{ top: trace.top, opacity: trace.opacity }}
      viewBox={`0 0 ${VIEW_W} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* the whole trace, barely there, like the monitor's persistence */}
      <path d={d} fill="none" stroke={trace.color} strokeOpacity={0.16} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {!reduced &&
        LAYERS.map((layer, i) => (
          <path
            key={i}
            ref={(el) => (refs.current[i] = el)}
            d={d}
            fill="none"
            stroke={trace.color}
            strokeOpacity={layer.alpha}
            strokeWidth={layer.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={`${layer.len} 3`}
            strokeDashoffset={layer.len}
            style={i >= 2 ? { filter: `drop-shadow(0 0 6px ${trace.color})` } : undefined}
          />
        ))}
    </svg>
  );
};

export const EcgBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* ECG paper grid, fading out towards the edges */}
      <div className="ecg-grid absolute inset-0" />
      {/* soft colour washes in the site palette */}
      <div className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-teal-400/10 blur-3xl" />
      {TRACES.map((trace) => (
        <TraceLine key={trace.top} trace={trace} reduced={reduced} />
      ))}
    </div>
  );
};
