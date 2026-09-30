import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FileSearch,
  FileText,
  FlaskConical,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useToast } from '../../context/ToastContext.js';
import { tx } from '../../i18n/index.js';
import { TrendChart } from '../../components/healthTracker/TrendChart.js';
import { InsightsPanel, HealthInsights } from '../../components/healthTracker/InsightsPanel.js';
import { AddReadingModal } from '../../components/healthTracker/AddReadingModal.js';
import { FLAG_STYLES, GROUP_LABELS, LabFlag, fmt, formatRange, groupLabel, parameterLabel } from '../../components/healthTracker/labels.js';

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

// ── Types (mirror GET /api/health-tracker) ────────────────────────────────────
interface SeriesPoint {
  id: string;
  date: string;
  value: number;
  flag: LabFlag;
  source: 'AI_EXTRACTED' | 'MANUAL';
  recordId?: string;
  recordTitle?: string;
}
export interface TrackerSeries {
  key: string;
  name: string;
  group: string;
  unit: string;
  range: { low?: number; high?: number };
  custom: boolean;
  latest: SeriesPoint;
  previous?: SeriesPoint;
  trend: 'UP' | 'DOWN' | 'FLAT' | 'NEW';
  points: SeriesPoint[];
}
export interface TrackerData {
  series: TrackerSeries[];
  summary: { parameters: number; readings: number; outOfRange: number; labReports: number; pendingReports: number };
  ai: { text: boolean; documents: boolean; images: boolean };
}
interface LabReport {
  id: string;
  title: string;
  recordDate: string;
  hasFile: boolean;
  status: 'PENDING' | 'DONE' | 'NO_VALUES' | 'FAILED' | 'UNSUPPORTED';
  valueCount: number;
}

// ── Pieces ────────────────────────────────────────────────────────────────────

const FlagPill: React.FC<{ flag: LabFlag }> = ({ flag }) => {
  const { t } = useLanguage();
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${FLAG_STYLES[flag].pill}`}>{t(FLAG_STYLES[flag].label)}</span>;
};

const TrendIcon: React.FC<{ trend: TrackerSeries['trend'] }> = ({ trend }) => {
  if (trend === 'UP') return <ArrowUpRight className="w-4 h-4" aria-hidden="true" />;
  if (trend === 'DOWN') return <ArrowDownRight className="w-4 h-4" aria-hidden="true" />;
  if (trend === 'FLAT') return <Minus className="w-4 h-4" aria-hidden="true" />;
  return null;
};

/** Small card per test with a sparkline; selecting one shows its full chart */
export const ParameterCard: React.FC<{ series: TrackerSeries; active: boolean; onSelect: () => void }> = ({ series, active, onSelect }) => {
  const { t, formatDate } = useLanguage();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group text-left rounded-2xl border bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5 ${
        active ? 'border-violet-400 ring-2 ring-violet-500/20' : 'border-slate-200/90'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{parameterLabel(series.name, series.custom)}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{groupLabel(series.group)}</p>
        </div>
        <FlagPill flag={series.latest.flag} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {fmt(series.latest.value)}
          <span className="ml-1 text-[11px] font-medium text-slate-400">{series.unit}</span>
        </p>
        {series.previous && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${FLAG_STYLES[series.latest.flag].text}`}>
            <TrendIcon trend={series.trend} />
            {fmt(series.latest.value - series.previous.value)}
          </span>
        )}
      </div>
      {series.points.length > 1 ? (
        <TrendChart compact points={series.points} range={series.range} unit={series.unit} className="mt-2" />
      ) : (
        <p className="mt-3 text-[11px] text-slate-400">{t('One reading on {date}', { date: formatDate(series.latest.date, SHORT_DATE) })}</p>
      )}
    </button>
  );
};

/** The large chart for the selected test plus every reading behind it */
export const SeriesDetail: React.FC<{
  series: TrackerSeries;
  onDelete: (point: SeriesPoint) => void;
  onAdd: () => void;
  deletingId?: string | null;
}> = ({ series, onDelete, onAdd, deletingId }) => {
  const { t, formatDate } = useLanguage();
  const rangeText = formatRange(series.range, series.unit);
  const change = series.previous ? series.latest.value - series.previous.value : null;
  return (
    <section className="glass-card border-slate-200/90 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">{groupLabel(series.group)}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{parameterLabel(series.name, series.custom)}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {rangeText ? t('Healthy range: {range}', { range: rangeText }) : t('No reference range for this test')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {fmt(series.latest.value)}
            <span className="ml-1 text-sm font-medium text-slate-400">{series.unit}</span>
          </p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <FlagPill flag={series.latest.flag} />
            <span className="text-[11px] text-slate-400">{formatDate(series.latest.date, SHORT_DATE)}</span>
          </div>
          {change !== null && series.previous && (
            <p className="mt-1 text-[11px] text-slate-500">
              {t('{change} since {date}', { change: `${change > 0 ? '+' : ''}${fmt(change)} ${series.unit}`, date: formatDate(series.previous.date, SHORT_DATE) })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <TrendChart key={series.key} points={series.points} range={series.range} unit={series.unit} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-emerald-500/15 ring-1 ring-emerald-500/30" aria-hidden="true" />
          {t('Healthy range')}
        </span>
        {(['NORMAL', 'HIGH', 'LOW'] as LabFlag[]).map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: FLAG_STYLES[f].dot }} aria-hidden="true" />
            {t(FLAG_STYLES[f].label)}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('All readings')}</h3>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t('Add result')}
        </button>
      </div>
      <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white/70">
        {[...series.points].reverse().map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: FLAG_STYLES[p.flag].dot }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {fmt(p.value)} <span className="text-xs font-normal text-slate-400">{series.unit}</span>
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {formatDate(p.date, SHORT_DATE)} ·{' '}
                {p.source === 'MANUAL' ? t('Added by you') : t('From report: {title}', { title: p.recordTitle ?? t('Lab report') })}
              </p>
            </div>
            <FlagPill flag={p.flag} />
            <button
              type="button"
              onClick={() => onDelete(p)}
              disabled={deletingId === p.id}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              title={t('Remove this reading')}
              aria-label={t('Remove this reading')}
            >
              {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

const REPORT_STATUS: Record<LabReport['status'], string> = {
  PENDING: tx('Not read yet'),
  DONE: tx('{count} values found'),
  NO_VALUES: tx('No test values found'),
  FAILED: tx('Could not be read'),
  UNSUPPORTED: tx('File type not supported'),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const PatientHealthTrackerPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [data, setData] = useState<TrackerData | null>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<string>('ALL');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<{ done: number; total: number } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [addFor, setAddFor] = useState<string | undefined | null>(null);
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [trackerRes, reportsRes] = await Promise.all([api.getHealthTracker(), api.getLabReports()]);
      setData(trackerRes.data);
      setReports(reportsRes.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || t('Could not load your health tracker'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const generateInsights = useCallback(
    async (refresh = false) => {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        const res = await api.getHealthInsights(lang, refresh);
        setInsights(res.data);
      } catch (err: any) {
        setInsightsError(err.message || t('Could not get insights right now'));
      } finally {
        setInsightsLoading(false);
      }
    },
    [lang, t]
  );

  // Insights follow the data and the chosen language (the server caches unchanged answers)
  const dataVersion = data ? `${data.summary.readings}:${data.series.map((s) => s.latest.id).join(',')}` : '';
  useEffect(() => {
    if (data?.series.length && data.ai.text) generateInsights(false);
    else setInsights(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, lang]);

  const series = data?.series ?? [];
  const groups = useMemo(() => Object.keys(GROUP_LABELS).filter((g) => series.some((s) => s.group === g)), [series]);
  const visible = group === 'ALL' ? series : series.filter((s) => s.group === group);
  const selected = series.find((s) => s.key === selectedKey) ?? visible[0] ?? null;

  const analyze = async (recordId?: string) => {
    if (recordId) setRetryingId(recordId);
    else setAnalyzing({ done: 0, total: data?.summary.pendingReports ?? 0 });
    let added = 0;
    try {
      let remaining = 0;
      let done = 0;
      do {
        const res = await api.analyzeLabReports(recordId);
        added += res.data.valuesAdded;
        done += res.data.processed;
        remaining = res.data.remaining;
        if (!recordId) setAnalyzing({ done, total: done + remaining });
        if (!res.data.processed) break;
      } while (!recordId && remaining > 0);
      showToast(added ? t('Found {count} test values in your reports', { count: added }) : t('No new test values were found'), added ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message || t('Could not read your reports right now'), 'error');
    } finally {
      setAnalyzing(null);
      setRetryingId(null);
      await load();
    }
  };

  const deleteReading = async (p: SeriesPoint) => {
    if (!window.confirm(t('Remove this reading from your tracker?'))) return;
    setDeletingId(p.id);
    try {
      await api.deleteLabReading(p.id);
      await load();
    } catch (err: any) {
      showToast(err.message || t('Could not remove the reading'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const select = (key: string) => {
    setSelectedKey(key);
    if (window.innerWidth < 1024) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summary = data?.summary;
  const pending = summary?.pendingReports ?? 0;
  const hasData = series.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <header className="glass-card p-6 border-slate-200/90 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" aria-hidden="true" />
            {t('Health Tracker')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('See how your lab results change over time, with AI guidance on what to do next.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddFor(undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('Add result')}
          </button>
          <Link
            to="/patient/records"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {t('Upload lab report')}
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="glass-card border-slate-200/90 flex items-center justify-center gap-3 py-20 text-sm text-slate-500" role="status">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" aria-hidden="true" />
          {t('Loading your results…')}
        </div>
      ) : (
        <>
          {/* Reports waiting to be read */}
          {(pending > 0 || analyzing) && (
            <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-teal-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <FileSearch className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {analyzing
                        ? t('Reading your reports… {done} of {total}', { done: analyzing.done, total: analyzing.total })
                        : t('{count} lab reports are ready to be read', { count: pending })}
                    </p>
                    <p className="mt-0.5 flex items-start gap-1.5 text-xs text-slate-600">
                      <ShieldCheck className="mt-0.5 w-3.5 h-3.5 shrink-0 text-teal-600" aria-hidden="true" />
                      {t('To pull out your test values, the report is read by our AI provider. It is not shared with doctors or used for anything else.')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => analyze()}
                  disabled={!!analyzing || !data?.ai.text}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-500 transition disabled:opacity-60"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
                  {analyzing ? t('Reading…') : t('Read my reports')}
                </button>
              </div>
              {analyzing && analyzing.total > 0 && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 transition-[width] duration-500"
                    style={{ width: `${Math.max(6, (analyzing.done / analyzing.total) * 100)}%` }}
                  />
                </div>
              )}
            </section>
          )}

          {!hasData ? (
            <section className="glass-card border-slate-200/90 px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <FlaskConical className="w-7 h-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{t('No lab results to show yet')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {summary?.labReports
                  ? t('Read your uploaded lab reports to see your sugar, cholesterol, vitamin and other levels as graphs.')
                  : t('Upload a lab report or type in a result to start seeing your sugar, cholesterol, vitamin and other levels as graphs.')}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link to="/patient/records" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
                  <Upload className="w-4 h-4" aria-hidden="true" /> {t('Upload lab report')}
                </Link>
                <button type="button" onClick={() => setAddFor(undefined)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Plus className="w-4 h-4" aria-hidden="true" /> {t('Add result')}
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: t('Tests tracked'), value: summary!.parameters, tone: 'text-slate-900' },
                  { label: t('Readings'), value: summary!.readings, tone: 'text-slate-900' },
                  { label: t('Outside healthy range'), value: summary!.outOfRange, tone: summary!.outOfRange ? 'text-rose-600' : 'text-emerald-600' },
                  { label: t('Lab reports'), value: summary!.labReports, tone: 'text-slate-900' },
                ].map((s) => (
                  <div key={s.label} className="glass-card border-slate-200/90 p-4">
                    <p className={`text-2xl font-bold tracking-tight ${s.tone}`}>{s.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px]">
                {/* On phones the insights sit right after the main chart (order-3); on desktop they get their own column */}
                <div className="contents lg:block lg:space-y-6 lg:min-w-0">
                  {/* Group filter */}
                  <div className="order-1 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('Filter by test type')}>
                    {['ALL', ...groups].map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="tab"
                        aria-selected={group === g}
                        onClick={() => {
                          setGroup(g);
                          setSelectedKey(null);
                        }}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          group === g ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g === 'ALL' ? t('All tests') : groupLabel(g)}
                      </button>
                    ))}
                  </div>

                  <div ref={detailRef} className="order-2 scroll-mt-24 min-w-0">
                    {selected && (
                      <SeriesDetail series={selected} onDelete={deleteReading} onAdd={() => setAddFor(selected.custom ? undefined : selected.key)} deletingId={deletingId} />
                    )}
                  </div>

                  <div className="order-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((s) => (
                      <ParameterCard key={s.key} series={s} active={selected?.key === s.key} onSelect={() => select(s.key)} />
                    ))}
                  </div>
                </div>

                <div className="order-3 lg:order-none lg:sticky lg:top-6 lg:self-start">
                  <InsightsPanel
                    insights={insights}
                    isLoading={insightsLoading}
                    error={insightsError}
                    canGenerate={hasData && !!data?.ai.text}
                    onGenerate={generateInsights}
                  />
                </div>
              </div>
            </>
          )}

          {/* Report list with per-report status and retry */}
          {reports.length > 0 && (
            <section className="glass-card border-slate-200/90">
              <button
                type="button"
                onClick={() => setShowReports((v) => !v)}
                aria-expanded={showReports}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileText className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  {t('Your lab reports ({count})', { count: reports.length })}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showReports ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {showReports && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {reports.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{r.title}</p>
                        <p className="text-[11px] text-slate-500">{t(REPORT_STATUS[r.status], { count: r.valueCount })}</p>
                      </div>
                      {r.status !== 'UNSUPPORTED' && (
                        <button
                          type="button"
                          onClick={() => analyze(r.id)}
                          disabled={!!retryingId || !!analyzing || !data?.ai.text}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {retryingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : r.status === 'PENDING' ? (
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {r.status === 'PENDING' ? t('Read') : t('Read again')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <AddReadingModal isOpen={addFor !== null} initialKey={addFor ?? undefined} onClose={() => setAddFor(null)} onSaved={load} />
    </div>
  );
};
