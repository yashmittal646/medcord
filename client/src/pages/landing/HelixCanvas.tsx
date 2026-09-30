import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './scrollFx.js';

// lavender -> indigo -> teal along the strand
const STOPS: [number, [number, number, number]][] = [
  [0, [196, 181, 253]],
  [0.45, [129, 140, 248]],
  [1, [45, 212, 191]],
];
function colorAt(t: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

// deterministic pseudo-random per particle so the dissolve pattern is stable
const rand = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Props {
  className?: string;
  /** 0..1, how far the hero has scrolled away; loosens the helix into drifting particles */
  scrollRef?: React.MutableRefObject<number>;
}

/** A rotating DNA double helix drawn as particles, dissolving at its tail */
export const HelixCanvas: React.FC<Props> = ({ className, scrollRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduced) loop(performance.now());
    });
    io.observe(canvas);

    const N = w < 500 ? 70 : 110; // particles per strand
    const TURNS = 2.4;

    const draw = (time: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const scroll = scrollRef?.current ?? 0;
      ctx.clearRect(0, 0, w, h);

      const len = Math.hypot(w, h) * 0.95;
      const radius = Math.min(w, h) * 0.13;
      const tilt = -0.62 + mouse.x * 0.08; // radians, leaning top-right
      const cx = w * 0.5 + mouse.x * 14;
      const cy = h * 0.5 + mouse.y * 10;
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);
      const spin = time * 0.00045;

      type P = { x: number; y: number; z: number; t: number; strand: number; i: number };
      const pts: P[] = [];
      for (let strand = 0; strand < 2; strand++) {
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const a = t * TURNS * Math.PI * 2 + spin + strand * Math.PI;
          let lx = Math.cos(a) * radius;
          let ly = (t - 0.5) * len;
          const z = Math.sin(a);
          // the tail (and, on scroll, more of the strand) breaks apart into drifting dust
          const dissolveFrom = 0.78 - scroll * 0.55;
          if (t > dissolveFrom) {
            const k = (t - dissolveFrom) / (1 - dissolveFrom);
            const drift = k * k * (60 + scroll * 220);
            lx += (rand(i, strand) - 0.5) * drift * 2.2 + Math.sin(time * 0.001 + i) * k * 6;
            ly += (rand(i, strand + 7) - 0.3) * drift;
          }
          pts.push({ x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos, z, t, strand, i });
        }
      }

      // rungs (base pairs) behind the particles
      ctx.lineCap = 'round';
      for (let i = 0; i < N; i += 3) {
        const a = pts[i];
        const b = pts[i + N];
        if (a.t > 0.8 - scroll * 0.55) continue;
        const [r, g, bl] = colorAt(a.t);
        const depth = (a.z + b.z) / 2;
        ctx.strokeStyle = `rgba(${r | 0},${g | 0},${bl | 0},${0.08 + (depth + 1) * 0.07})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // back-to-front so near particles overlap far ones
      pts.sort((p, q) => p.z - q.z);
      for (const p of pts) {
        const near = (p.z + 1) / 2; // 0 far .. 1 near
        const size = 1.2 + near * (w < 500 ? 3.2 : 4.4) * (1 - Math.max(0, p.t - 0.85) * 2);
        const [r, g, b] = colorAt(p.t);
        const alpha = 0.25 + near * 0.7;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, size), 0, Math.PI * 2);
        ctx.fill();
        if (near > 0.82) {
          ctx.fillStyle = `rgba(255,255,255,${(near - 0.82) * 2.2})`;
          ctx.beginPath();
          ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (time: number) => {
      cancelAnimationFrame(raf);
      if (!visible) return;
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) draw(1200);
    else loop(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced, scrollRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};
