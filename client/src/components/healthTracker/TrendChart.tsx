import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { FLAG_STYLES, LabFlag, fmt } from './labels.js';

export interface ChartPoint {
  id: string;
  date: string;
  value: number;
  flag: LabFlag;
  recordTitle?: string;
}

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

interface Props {
  points: ChartPoint[];
  range: { low?: number; high?: number };
  unit: string;
  /** Sparkline mode: no axes, no tooltip */
  compact?: boolean;
  height?: number;
  className?: string;
}

const PAD = { top: 18, right: 18, bottom: 34, left: 48 };

/** Smooth line through the points (monotone-ish Catmull-Rom → cubic Bézier) */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    // keep control points vertically between the two ends so the curve never overshoots a reading
    const lo = Math.min(p1.y, p2.y);
    const hi = Math.max(p1.y, p2.y);
    c1.y = Math.min(hi, Math.max(lo, c1.y));
    c2.y = Math.min(hi, Math.max(lo, c2.y));
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Line chart of one lab parameter over time, with the healthy range shaded */
export const TrendChart: React.FC<Props> = ({ points, range, unit, compact = false, height = 260, className = '' }) => {
  const { formatDate } = useLanguage();
  const gid = useId().replace(/:/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(compact ? 160 : 640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = compact ? { top: 6, right: 6, bottom: 6, left: 6 } : PAD;
  const h = compact ? 56 : height;
  const innerW = Math.max(10, width - pad.left - pad.right);
  const innerH = h - pad.top - pad.bottom;

  const geo = useMemo(() => {
    const times = points.map((p) => +new Date(p.date));
    const values = points.map((p) => p.value);
    const bounds = [...values, ...(range.low !== undefined ? [range.low] : []), ...(range.high !== undefined ? [range.high] : [])];
    let yMin = Math.min(...bounds);
    let yMax = Math.max(...bounds);
    const margin = (yMax - yMin || Math.abs(yMax) * 0.2 || 1) * 0.15;
    yMin = Math.max(Math.min(...values) >= 0 ? 0 : -Infinity, yMin - margin);
    yMax += margin;
    const ticks = compact ? [] : niceTicks(yMin, yMax);
    if (ticks.length) {
      yMin = Math.min(yMin, ticks[0]);
      yMax = Math.max(yMax, ticks[ticks.length - 1]);
    }
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const x = (t: number) => (tMax === tMin ? pad.left + innerW / 2 : pad.left + ((t - tMin) / (tMax - tMin)) * innerW);
    const y = (v: number) => pad.top + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH;
    const xy = points.map((p, i) => ({ x: x(times[i]), y: y(p.value) }));
    return { x, y, xy, ticks, tMin, tMax, times };
  }, [points, range.low, range.high, innerW, innerH, pad.left, pad.top, compact]);

  if (!points.length) return null;

  const line = smoothPath(geo.xy);
  const bandTop = range.high !== undefined ? geo.y(range.high) : pad.top;
  const bandBottom = range.low !== undefined ? geo.y(range.low) : pad.top + innerH;
  const hasBand = range.low !== undefined || range.high !== undefined;
  const area = line && `${line} L${geo.xy[geo.xy.length - 1].x},${pad.top + innerH} L${geo.xy[0].x},${pad.top + innerH} Z`;

  // up to ~6 date labels, always including first and last
  const xLabels = compact
    ? []
    : points
        .map((p, i) => ({ i, x: geo.xy[i].x, label: formatDate(p.date, { month: 'short', year: '2-digit' }) }))
        .filter((_l, idx, arr) => idx === 0 || idx === arr.length - 1 || idx % Math.ceil(arr.length / 6) === 0)
        .filter((l, idx, arr) => idx === 0 || l.x - arr[idx - 1].x > 54);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (compact) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    geo.xy.forEach((p, i) => {
      if (Math.abs(p.x - mx) < Math.abs(geo.xy[best].x - mx)) best = i;
    });
    setHover(best);
  };

  const hp = hover !== null ? points[hover] : null;
  const hxy = hover !== null ? geo.xy[hover] : null;

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${width} ${h}`}
        className="block overflow-visible touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={points.map((p) => `${formatDate(p.date, SHORT_DATE)}: ${fmt(p.value)} ${unit}`).join('; ')}
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f4e8c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1f4e8c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${gid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#1f4e8c" />
            <stop offset="100%" stopColor="#1f4e8c" />
          </linearGradient>
        </defs>

        {/* healthy range */}
        {hasBand && (
          <rect
            x={pad.left}
            width={innerW}
            y={Math.min(bandTop, bandBottom)}
            height={Math.abs(bandBottom - bandTop)}
            fill="#10b981"
            fillOpacity={0.08}
          />
        )}
        {!compact && range.high !== undefined && (
          <line x1={pad.left} x2={pad.left + innerW} y1={geo.y(range.high)} y2={geo.y(range.high)} stroke="#10b981" strokeOpacity={0.5} strokeDasharray="4 4" />
        )}
        {!compact && range.low !== undefined && (
          <line x1={pad.left} x2={pad.left + innerW} y1={geo.y(range.low)} y2={geo.y(range.low)} stroke="#10b981" strokeOpacity={0.5} strokeDasharray="4 4" />
        )}

        {/* y grid + labels */}
        {geo.ticks.map((tv) => (
          <g key={tv}>
            <line x1={pad.left} x2={pad.left + innerW} y1={geo.y(tv)} y2={geo.y(tv)} stroke="#0f172a" strokeOpacity={0.06} />
            <text x={pad.left - 8} y={geo.y(tv)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px]">
              {fmt(tv)}
            </text>
          </g>
        ))}
        {xLabels.map((l) => (
          <text key={l.i} x={l.x} y={h - 10} textAnchor="middle" className="fill-slate-400 text-[10px]">
            {l.label}
          </text>
        ))}

        {area && <path d={area} fill={`url(#area-${gid})`} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={`url(#line-${gid})`}
            strokeWidth={compact ? 2 : 2.5}
            strokeLinecap="round"
            className="ht-draw"
            pathLength={1}
          />
        )}

        {hxy && (
          <line x1={hxy.x} x2={hxy.x} y1={pad.top} y2={pad.top + innerH} stroke="#0f172a" strokeOpacity={0.15} strokeDasharray="3 3" />
        )}
        {geo.xy.map((p, i) => (
          <circle
            key={points[i].id}
            cx={p.x}
            cy={p.y}
            r={compact ? (i === geo.xy.length - 1 ? 3 : 0) : hover === i ? 6 : 4.5}
            fill={FLAG_STYLES[points[i].flag].dot}
            stroke="#fff"
            strokeWidth={compact ? 1.5 : 2}
            className="transition-[r] duration-150"
          />
        ))}
      </svg>

      {hp && hxy && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900 px-3 py-2 text-[11px] text-white shadow-xl"
          style={{ left: Math.min(Math.max(hxy.x, 70), width - 70), top: hxy.y - 10 }}
        >
          <p className="font-semibold whitespace-nowrap">
            {fmt(hp.value)} {unit}
          </p>
          <p className="text-slate-300 whitespace-nowrap">{formatDate(hp.date, SHORT_DATE)}</p>
          {hp.recordTitle && <p className="max-w-[180px] truncate text-slate-400">{hp.recordTitle}</p>}
        </div>
      )}
    </div>
  );
};
