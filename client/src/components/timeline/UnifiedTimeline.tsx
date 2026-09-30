import React, { useId, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Building2,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  FlaskConical,
  Paperclip,
  Pill,
  ScanLine,
  Search,
  Stethoscope,
  Syringe,
  UserRound,
  X,
} from 'lucide-react';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import type { MedicalRecord, MedicalRecordType, MetricItem } from './types.js';
import { tx } from '../../i18n/index.js';
import { RECORD_TYPES } from './types.js';

interface TypeStyle {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** icon node on the rail */
  node: string;
  /** badge / chip */
  badge: string;
}

// Label keys are translated at render time; colors work on light and dark backgrounds
const TYPE_STYLE: Record<MedicalRecordType, TypeStyle> = {
  consultation: {
    label: tx('Consultation'), Icon: Stethoscope,
    node: 'bg-emerald-500 text-white ring-emerald-100 dark:ring-emerald-900/60',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  lab_report: {
    label: tx('Lab Report'), Icon: FlaskConical,
    node: 'bg-sky-500 text-white ring-sky-100 dark:ring-sky-900/60',
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  },
  prescription: {
    label: tx('Prescription'), Icon: ClipboardList,
    node: 'bg-teal-500 text-white ring-teal-100 dark:ring-teal-900/60',
    badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  },
  medication: {
    label: tx('Medication'), Icon: Pill,
    node: 'bg-violet-500 text-white ring-violet-100 dark:ring-violet-900/60',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  },
  vaccination: {
    label: tx('Vaccination'), Icon: Syringe,
    node: 'bg-lime-600 text-white ring-lime-100 dark:ring-lime-900/60',
    badge: 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800',
  },
  imaging: {
    label: tx('Imaging'), Icon: ScanLine,
    node: 'bg-indigo-500 text-white ring-indigo-100 dark:ring-indigo-900/60',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  diagnosis: {
    label: tx('Diagnosis'), Icon: Activity,
    node: 'bg-amber-500 text-white ring-amber-100 dark:ring-amber-900/60',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  allergy: {
    label: tx('Allergy'), Icon: AlertTriangle,
    node: 'bg-rose-500 text-white ring-rose-100 dark:ring-rose-900/60',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
};

const METRIC_STYLE: Record<NonNullable<MetricItem['status']>, string> = {
  normal: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  critical: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

const toTime = (iso: string) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export interface UnifiedTimelineProps {
  records: MedicalRecord[];
  isLoading?: boolean;
  /** Opens the full record view (e.g. the document modal) */
  onViewRecord?: (record: MedicalRecord) => void;
  /** Opens the uploaded file behind an entry */
  onOpenFile?: (recordId: string) => void;
  /** Message shown when there is nothing at all to display */
  emptyMessage?: string;
}

export const UnifiedTimeline: React.FC<UnifiedTimelineProps> = ({
  records,
  isLoading,
  onViewRecord,
  onOpenFile,
  emptyMessage,
}) => {
  const { t } = useLanguage();
  const [activeTypes, setActiveTypes] = useState<Set<MedicalRecordType>>(new Set());
  const [query, setQuery] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const locale = getLocale();

  const counts = useMemo(() => {
    const c = Object.fromEntries(RECORD_TYPES.map((type) => [type, 0])) as Record<MedicalRecordType, number>;
    records.forEach((r) => (c[r.type] += 1));
    return c;
  }, [records]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => activeTypes.size === 0 || activeTypes.has(r.type))
      .filter(
        (r) =>
          !q ||
          [r.title, r.description, r.doctorName, r.facility, r.status, ...(r.tags ?? []), t(TYPE_STYLE[r.type].label)]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
      )
      .sort((a, b) => (newestFirst ? toTime(b.date) - toTime(a.date) : toTime(a.date) - toTime(b.date)));
  }, [records, activeTypes, query, newestFirst, t]);

  // Year -> month groups, in display order
  const groups = useMemo(() => {
    const out: { year: string; months: { key: string; label: string; items: MedicalRecord[] }[] }[] = [];
    for (const r of visible) {
      const d = new Date(r.date);
      const valid = !Number.isNaN(d.getTime());
      const year = valid ? String(d.getFullYear()) : '—';
      const monthKey = valid ? `${year}-${d.getMonth()}` : 'unknown';
      const monthLabel = valid ? d.toLocaleDateString(locale, { month: 'long' }) : '';
      let y = out[out.length - 1];
      if (!y || y.year !== year) out.push((y = { year, months: [] }));
      let m = y.months[y.months.length - 1];
      if (!m || m.key !== monthKey) y.months.push((m = { key: monthKey, label: monthLabel, items: [] }));
      m.items.push(r);
    }
    return out;
  }, [visible, locale]);

  const toggleType = (type: MedicalRecordType) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtersActive = activeTypes.size > 0 || query.trim() !== '';

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t('Loading timeline…')}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
            <div className="flex-1 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search by title, doctor, facility or tag…')}
              aria-label={t('Search the timeline')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {newestFirst ? <ArrowDownWideNarrow className="w-4 h-4" aria-hidden="true" /> : <ArrowUpWideNarrow className="w-4 h-4" aria-hidden="true" />}
            {newestFirst ? t('Newest first') : t('Oldest first')}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Filter by type')}>
          {RECORD_TYPES.filter((type) => counts[type] > 0).map((type) => {
            const { Icon, label, badge } = TYPE_STYLE[type];
            const on = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={on}
                onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  on ? badge + ' ring-1 ring-current' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t(label)}
                <span className="tabular-nums opacity-70">{counts[type]}</span>
              </button>
            );
          })}
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setActiveTypes(new Set());
                setQuery('');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" /> {t('Clear filters')}
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400" aria-live="polite">
          {t('Showing {shown} of {total} entries', { shown: visible.length, total: records.length })}
        </p>
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {records.length === 0 ? emptyMessage ?? t('No medical history yet') : t('No entries match your filters')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((year) => (
            <section key={year.year} aria-label={year.year}>
              <h2 className="sticky top-0 z-10 -mx-1 px-1 py-1.5 mb-3 text-sm font-extrabold tracking-wide text-slate-900 dark:text-slate-100 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur">
                {year.year}
              </h2>
              {year.months.map((month) => (
                <div key={month.key} className="mb-5">
                  {month.label && (
                    <h3 className="ml-14 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{month.label}</h3>
                  )}
                  <ol className="relative space-y-3 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                    {month.items.map((r) => (
                      <TimelineItem
                        key={r.id}
                        record={r}
                        isExpanded={expanded.has(r.id)}
                        onToggle={() => toggleExpanded(r.id)}
                        onViewRecord={onViewRecord}
                        onOpenFile={onOpenFile}
                      />
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineItem: React.FC<{
  record: MedicalRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onViewRecord?: (record: MedicalRecord) => void;
  onOpenFile?: (recordId: string) => void;
}> = ({ record: r, isExpanded, onToggle, onViewRecord, onOpenFile }) => {
  const { t } = useLanguage();
  const panelId = useId();
  const style = TYPE_STYLE[r.type];
  const hasDetails = Boolean(r.description || r.tags?.length || r.metrics?.length);
  const date = new Date(r.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <li className="relative flex gap-4">
      <span
        className={`relative z-[1] mt-1 w-10 h-10 shrink-0 rounded-full flex items-center justify-center ring-4 ${style.node}`}
        aria-hidden="true"
      >
        <style.Icon className="w-4 h-4" />
      </span>

      <article
        className={`flex-1 min-w-0 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-shadow hover:shadow-md ${
          r.critical ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={hasDetails ? onToggle : undefined}
          aria-expanded={hasDetails ? isExpanded : undefined}
          aria-controls={hasDetails ? panelId : undefined}
          disabled={!hasDetails}
          className="w-full text-left p-4 flex items-start gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-default"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>{t(style.label)}</span>
              {dateLabel && (
                <time dateTime={r.date} className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {dateLabel}
                </time>
              )}
              {r.status && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.critical
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {r.status}
                </span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 break-words">{r.title}</h4>
            {(r.doctorName || r.facility) && (
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {r.doctorName && (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('Dr. {name}', { name: r.doctorName.replace(/^Dr\.?\s+/i, '') })}
                  </span>
                )}
                {r.facility && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {r.facility}
                  </span>
                )}
              </p>
            )}
            {!isExpanded && r.description && (
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{r.description}</p>
            )}
          </div>
          {hasDetails && (
            <ChevronDown
              className={`w-4 h-4 mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          )}
        </button>

        {hasDetails && isExpanded && (
          <div id={panelId} className="px-4 pb-4 -mt-1 space-y-3">
            {r.description && (
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{r.description}</p>
            )}
            {r.metrics && r.metrics.length > 0 && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {r.metrics.map((m) => (
                  <div
                    key={m.label}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-xs ${
                      METRIC_STYLE[m.status ?? 'normal']
                    }`}
                  >
                    <dt className="font-medium">{m.label}</dt>
                    <dd className="font-mono font-bold">
                      {m.value}
                      {m.status && m.status !== 'normal' && <span className="sr-only"> ({m.status === 'critical' ? t('Critical') : t('Warning')})</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {r.tags && r.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label={t('Tags')}>
                {r.tags.map((tag) => (
                  <li key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(r.recordId && onViewRecord) || (r.hasFile && r.recordId && onOpenFile) || r.fileUrl ? (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {r.recordId && onViewRecord && (
              <button
                type="button"
                onClick={() => onViewRecord(r)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" /> {t('View record')}
              </button>
            )}
            {r.hasFile && r.recordId && onOpenFile && (
              <button
                type="button"
                onClick={() => onOpenFile(r.recordId!)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
              >
                <Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> {t('Open attachment')}
              </button>
            )}
            {!r.recordId && r.fileUrl && (
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                <Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> {t('Open attachment')}
              </a>
            )}
          </div>
        ) : null}
      </article>
    </li>
  );
};
