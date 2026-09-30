import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useCountUp } from '../../pages/landing/scrollFx.js';
import { tr } from '../../context/LanguageContext.js';
import { tx } from '../../i18n/index.js';

/** Dashboard number tile: counts up on load, glows in its own colour on hover */
export const PortalStat: React.FC<{
  label: string;
  value: number;
  Icon: React.ElementType;
  /** tailwind classes for the icon chip, e.g. "bg-rose-50 text-rose-600" */
  tone: string;
  glow: string;
  to?: string;
  loading?: boolean;
  delay?: number;
}> = ({ label, value, Icon, tone, glow, to, loading = false, delay = 0 }) => {
  const n = useCountUp(value, !loading, 1100 + delay);
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        {to && <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500" />}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>
        {loading ? <span className="skeleton inline-block h-8 w-10 rounded-lg" /> : n}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </>
  );
  const cls = 'portal-stat glass-card-hover group block p-5';
  const style = { ['--stat-glow' as any]: glow };
  return to ? (
    <Link to={to} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
};

const GREETINGS = [tx('Good morning, {name}'), tx('Good afternoon, {name}'), tx('Good evening, {name}')];

/** "Good morning, Asha" by the visitor's local time */
export const greeting = (name: string) => {
  const h = new Date().getHours();
  return tr(GREETINGS[h < 12 ? 0 : h < 17 ? 1 : 2], { name });
};
