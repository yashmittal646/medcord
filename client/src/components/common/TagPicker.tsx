import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Search, Users } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';

export interface Taxonomy {
  specializations: string[];
  categories: string[];
  categoryDefaults: Record<string, string[]>;
  conditions: { key: string; label: string; sensitive: boolean; specs: string[] }[];
}

let cachedTaxonomy: Taxonomy | null = null;

export function useTaxonomy(): Taxonomy | null {
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(cachedTaxonomy);
  useEffect(() => {
    if (cachedTaxonomy) return;
    api
      .getTaxonomy()
      .then((res) => {
        cachedTaxonomy = res.data;
        setTaxonomy(res.data);
      })
      .catch(() => undefined);
  }, []);
  return taxonomy;
}

/** CARDIOLOGY -> Cardiology -> translated. Kept as an alias for existing imports. */
export const prettify = enumLabel;

/** Who would be able to open a record with these tags (mirrors the server's routing rules) */
export function previewAudience(taxonomy: Taxonomy, category: string, conditions: string[], sensitive: boolean) {
  const specs = new Set<string>(taxonomy.categoryDefaults[category] ?? []);
  conditions.forEach((k) => taxonomy.conditions.find((c) => c.key === k)?.specs.forEach((s) => specs.add(s)));
  const isSensitive = sensitive || conditions.some((k) => taxonomy.conditions.find((c) => c.key === k)?.sensitive);
  return { specs: [...specs], sensitive: isSensitive };
}

interface TagPickerProps {
  category: string;
  conditions: string[];
  sensitive: boolean;
  onChange: (next: { category: string; conditions: string[]; sensitive: boolean }) => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({ category, conditions, sensitive, onChange }) => {
  const { t } = useLanguage();
  const taxonomy = useTaxonomy();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    if (!taxonomy) return [];
    const q = query.trim().toLowerCase();
    return taxonomy.conditions.filter((c) => !q || t(c.label).toLowerCase().includes(q));
  }, [taxonomy, query]);

  if (!taxonomy) return <p className="text-[11px] text-slate-400">{t('Loading tag options…')}</p>;

  const audience = previewAudience(taxonomy, category, conditions, sensitive);
  const toggle = (key: string) =>
    onChange({
      category,
      sensitive,
      conditions: conditions.includes(key) ? conditions.filter((c) => c !== key) : [...conditions, key],
    });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('Category')}</label>
        <select
          value={category}
          onChange={(e) => onChange({ category: e.target.value, conditions, sensitive })}
          className="w-full glass-input text-xs bg-white"
        >
          {taxonomy.categories.map((c) => (
            <option key={c} value={c}>
              {prettify(c)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('Conditions this relates to')}</label>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('Search conditions…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full glass-input text-xs bg-white pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {visible.map((c) => {
            const on = conditions.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                className={`text-[11px] px-2 py-1 rounded-full border font-medium transition-colors ${
                  on
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}
              >
                {c.sensitive && <Lock className="inline w-2.5 h-2.5 mr-1 -mt-0.5" />}
                {t(c.label)}
              </button>
            );
          })}
          {visible.length === 0 && <span className="text-[11px] text-slate-400">{t('No matching conditions')}</span>}
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={sensitive}
          onChange={(e) => onChange({ category, conditions, sensitive: e.target.checked })}
          className="mt-0.5"
        />
        <span>
          <span className="font-semibold">{t('Highly confidential')}</span>
          <span className="block text-[11px] text-slate-500">
            
            {t('Only doctors you approve for this specific record can open it, whatever their specialty.')}
          </span>
        </span>
      </label>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
          <Users className="w-3.5 h-3.5 text-teal-600" />
          
          {t('Who can see this (connected doctors)')}
        </p>
        {audience.sensitive ? (
          <p>{t('Nobody by default. You approve each doctor individually.')}</p>
        ) : audience.specs.length ? (
          <p>{audience.specs.map(prettify).join(', ')}</p>
        ) : (
          <p>{t('Only you, until you add a category or condition.')}</p>
        )}
      </div>
    </div>
  );
};
