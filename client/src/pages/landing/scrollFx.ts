import { useEffect, useRef, useState, type RefObject } from 'react';

/** True when the visitor asked the OS for less motion; every effect below degrades to static when set */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Becomes true once the element scrolls into view (and stays true) */
export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2 }): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return [ref, inView];
}

// One shared scroll/resize listener driving every subscriber, batched per animation frame
type Sub = () => void;
const subs = new Set<Sub>();
let ticking = false;
const flush = () => {
  ticking = false;
  subs.forEach((fn) => fn());
};
const schedule = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(flush);
  }
};
function subscribe(fn: Sub) {
  if (subs.size === 0) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
  subs.add(fn);
  fn();
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  };
}

/**
 * Progress (0..1) of an element travelling through the viewport, written straight to a CSS variable
 * (`--p`) on the element so scroll-linked styles never re-render React.
 *   mode "through": 0 when the top enters the bottom of the viewport, 1 when the bottom leaves the top
 *   mode "pin":     0 when the top reaches the viewport top, 1 when the bottom reaches the viewport bottom
 *                   (for tall sections with a sticky child)
 */
export function useScrollProgress<T extends HTMLElement>(
  mode: 'through' | 'pin' = 'through',
  onProgress?: (p: number) => void
): RefObject<T> {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    return subscribe(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = mode === 'pin' ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
      const p = Math.min(1, Math.max(0, raw));
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    });
  }, [mode]);
  return ref;
}

/** Scroll velocity in px/frame, smoothed; used to speed up and flip marquees while scrolling */
export function useScrollVelocity(onVelocity: (v: number) => void) {
  const cb = useRef(onVelocity);
  cb.current = onVelocity;
  useEffect(() => {
    let lastY = window.scrollY;
    return subscribe(() => {
      const y = window.scrollY;
      cb.current(y - lastY);
      lastY = y;
    });
  }, []);
}

/** Counts from 0 to `target` once `start` becomes true (easeOutExpo) */
export function useCountUp(target: number, start: boolean, durationMs = 1600): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / durationMs);
      const eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      setValue(Math.round(target * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs, reduced]);
  return value;
}
