import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { GROUP_LABELS, groupLabel, parameterLabel } from './labels.js';

interface CatalogItem {
  key: string;
  name: string;
  group: string;
  unit: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-select a parameter (e.g. from its chart) */
  initialKey?: string;
  /** Catalog can be passed in (smoke tests); otherwise it is fetched */
  catalog?: CatalogItem[];
}

const OTHER = '__other__';
const today = () => new Date().toISOString().slice(0, 10);

/** Type in a result from a report the tracker could not read, or a home test */
export const AddReadingModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initialKey, catalog: given }) => {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogItem[]>(given ?? []);
  const [key, setKey] = useState(initialKey ?? '');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || given || catalog.length) return;
    api.getLabCatalog().then((res) => setCatalog(res.data || [])).catch(() => undefined);
  }, [isOpen, given, catalog.length]);

  useEffect(() => {
    if (!isOpen) return;
    setKey(initialKey ?? '');
    setName('');
    setValue('');
    setDate(today());
    setError(null);
  }, [isOpen, initialKey]);

  const selected = catalog.find((c) => c.key === key);
  useEffect(() => {
    if (selected) setUnit(selected.unit);
    else if (key === OTHER) setUnit('');
  }, [selected, key]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const c of catalog) map.set(c.group, [...(map.get(c.group) ?? []), c]);
    return Object.keys(GROUP_LABELS)
      .filter((g) => map.has(g))
      .map((g) => [g, map.get(g)!] as const);
  }, [catalog]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(value.replace(',', '.'));
    if (!key) return setError(t('Please choose a test or enter its name'));
    if (key === OTHER && !name.trim()) return setError(t('Please choose a test or enter its name'));
    if (!value.trim() || !Number.isFinite(num)) return setError(t('Please enter a number'));
    setSaving(true);
    try {
      await api.addLabReading({
        ...(key === OTHER ? { name: name.trim() } : { key }),
        value: num,
        unit: unit.trim() || undefined,
        takenAt: date,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Could not save the reading'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="glass-card max-w-md w-full p-6 relative border-slate-200/90 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#1f4e8c]" aria-hidden="true" />
            {t('Add a test result')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg" aria-label={t('Close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="ht-test" className="block text-xs font-medium text-slate-700 mb-1">{t('Test')}</label>
            <select id="ht-test" value={key} onChange={(e) => setKey(e.target.value)} className="w-full glass-input text-xs bg-white">
              <option value="">{t('Choose a test')}</option>
              {grouped.map(([group, items]) => (
                <optgroup key={group} label={groupLabel(group)}>
                  {items.map((c) => (
                    <option key={c.key} value={c.key}>
                      {parameterLabel(c.name)}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={OTHER}>{t('Another test (type its name)')}</option>
            </select>
          </div>

          {key === OTHER && (
            <div>
              <label htmlFor="ht-name" className="block text-xs font-medium text-slate-700 mb-1">{t('Test name')}</label>
              <input id="ht-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="w-full glass-input text-xs bg-white" placeholder={t('e.g. Homocysteine')} />
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label htmlFor="ht-value" className="block text-xs font-medium text-slate-700 mb-1">{t('Result')}</label>
              <input id="ht-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="w-full glass-input text-xs bg-white" placeholder="0.0" />
            </div>
            <div className="w-32">
              <label htmlFor="ht-unit" className="block text-xs font-medium text-slate-700 mb-1">{t('Unit')}</label>
              <input id="ht-unit" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={40} className="w-full glass-input text-xs bg-white" />
            </div>
          </div>
          {selected && <p className="-mt-2 text-[11px] text-slate-400">{t('Other units such as mmol/L are converted automatically.')}</p>}

          <div>
            <label htmlFor="ht-date" className="block text-xs font-medium text-slate-700 mb-1">{t('Test date')}</label>
            <input id="ht-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full glass-input text-xs bg-white" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('Save result')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
