import React from 'react';
import {
  AlertTriangle,
  Ban,
  CalendarCheck,
  CheckCircle2,
  Footprints,
  Loader2,
  RefreshCw,
  Salad,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export interface HealthInsights {
  summary: string;
  highlights: { test: string; status: 'GOOD' | 'WATCH' | 'CONCERN'; insight: string }[];
  eatMore: string[];
  limit: string[];
  lifestyle: string[];
  followUp: string[];
  urgent: string | null;
  generatedAt: string;
}

interface Props {
  insights: HealthInsights | null;
  isLoading: boolean;
  error: string | null;
  canGenerate: boolean;
  onGenerate: (refresh: boolean) => void;
}

const STATUS_STYLE = {
  GOOD: { ring: 'border-emerald-200 bg-emerald-50/60', dot: 'bg-emerald-500' },
  WATCH: { ring: 'border-amber-200 bg-amber-50/60', dot: 'bg-amber-500' },
  CONCERN: { ring: 'border-rose-200 bg-rose-50/60', dot: 'bg-rose-500' },
};

const List: React.FC<{ title: string; items: string[]; Icon: React.ElementType; tone: string }> = ({ title, items, Icon, tone }) =>
  items.length ? (
    <section>
      <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${tone}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

/** AI guidance built from the patient's lab trends */
export const InsightsPanel: React.FC<Props> = ({ insights, isLoading, error, canGenerate, onGenerate }) => {
  const { t, formatDate } = useLanguage();

  return (
    <aside className="glass-card overflow-hidden border-slate-200/90">
      <div className="border-b border-[#dfe3e9] p-5 text-[#172030]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="w-5 h-5 text-[#1f4e8c]" aria-hidden="true" />
              {t('AI Health Insights')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{t('Personal guidance based on your lab results and health profile.')}</p>
          </div>
          {insights && !isLoading && (
            <button
              type="button"
              onClick={() => onGenerate(true)}
              className="shrink-0 rounded-md border border-[#c9cfd8] p-2 text-slate-600 hover:bg-[#f0f2f5] transition-colors"
              title={t('Refresh insights')}
              aria-label={t('Refresh insights')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
            <Loader2 className="w-7 h-7 animate-spin text-[#1f4e8c]" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">{t('Reading your results…')}</p>
            <p className="text-xs text-slate-400">{t('This can take a few seconds.')}</p>
          </div>
        )}

        {!isLoading && error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {!isLoading && !insights && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-600">
              {canGenerate ? t('Get a plain-language summary of your results, with food and lifestyle tips.') : t('Insights appear once you have some lab results here.')}
            </p>
            {canGenerate && (
              <button
                type="button"
                onClick={() => onGenerate(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1f4e8c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#183f72] transition"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {t('Generate insights')}
              </button>
            )}
          </div>
        )}

        {!isLoading && insights && (
          <>
            {insights.urgent && (
              <div role="alert" className="flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3">
                <AlertTriangle className="mt-0.5 w-5 h-5 shrink-0 text-rose-600" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-rose-800">{t('Needs attention soon')}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-rose-800">{insights.urgent}</p>
                </div>
              </div>
            )}

            <p className="text-sm leading-relaxed text-slate-800">{insights.summary}</p>

            {insights.highlights.length > 0 && (
              <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  {t('What your results show')}
                </h4>
                <ul className="mt-2 space-y-2">
                  {insights.highlights.map((h) => (
                    <li key={h.test + h.insight} className={`rounded-xl border p-3 ${STATUS_STYLE[h.status].ring}`}>
                      <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[h.status].dot}`} aria-hidden="true" />
                        {h.test}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{h.insight}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <List title={t('Eat more')} items={insights.eatMore} Icon={Salad} tone="text-emerald-700" />
            <List title={t('Cut down on')} items={insights.limit} Icon={Ban} tone="text-amber-700" />
            <List title={t('Daily habits')} items={insights.lifestyle} Icon={Footprints} tone="text-sky-700" />
            <List title={t('Next steps')} items={insights.followUp} Icon={CalendarCheck} tone="text-[#1f4e8c]" />

            <div className="flex gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
              <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <p>
                {t('This is general guidance from AI, not a diagnosis. Talk to your doctor before changing your diet, medicines or routine.')}{' '}
                {t('Updated {date}', { date: formatDate(insights.generatedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) })}
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
