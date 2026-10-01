import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Plus, Star } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';
import { MEDICINE_FORM_OPTIONS } from './forms.js';

export interface MedicinePick {
  id: string;
  brandName: string;
  strength?: string;
  form?: string;
  genericName?: string;
  scope?: string;
  favourite?: boolean;
}

interface Props {
  value: { medicineId: string; name: string } | null;
  onSelect: (m: MedicinePick) => void;
  onClear: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  autoFocus?: boolean;
}

// Recents change only when a prescription is issued, so one fetch per page load is enough
let recentCache: Promise<MedicinePick[]> | null = null;
const loadRecent = () => (recentCache ??= api.recentMedicines().then((r) => r.data ?? []).catch(() => []));

/** Medicine search for one prescription row: recents first, then catalogue search, then "add new" */
export const MedicineAutocomplete: React.FC<Props> = ({ value, onSelect, onClear, inputRef, autoFocus }) => {
  const { t } = useLanguage();
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MedicinePick[]>([]);
  const [showingRecent, setShowingRecent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ brandName: '', strength: '', form: 'TABLET', genericName: '' });
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value?.name ?? ''), [value?.medicineId, value?.name]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Debounced search (200 ms); empty query shows favourites and recently used medicines
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const mine = ++seq.current;
    if (!q || (value && q === value.name)) {
      loadRecent().then((r) => {
        if (mine !== seq.current) return;
        setItems(r);
        setShowingRecent(true);
        setActive(0);
      });
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchMedicines(q);
        if (mine !== seq.current) return;
        setItems(res.data ?? []);
        setShowingRecent(false);
        setActive(0);
      } catch {
        if (mine === seq.current) setItems([]);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, value]);

  const pick = (m: MedicinePick) => {
    onSelect(m);
    setQuery(m.brandName);
    setOpen(false);
    setAdding(false);
  };

  const canAdd = !showingRecent && !loading && query.trim().length >= 2;
  const optionCount = items.length + (canAdd ? 1 : 0);

  const startAdd = () => {
    setDraft({ brandName: query.trim(), strength: '', form: 'TABLET', genericName: '' });
    setError(null);
    setAdding(true);
  };

  const saveNew = async () => {
    if (draft.brandName.trim().length < 2) return setError(t('Medicine name is required'));
    try {
      const res = await api.addMedicine({
        brandName: draft.brandName.trim(),
        strength: draft.strength.trim() || undefined,
        form: draft.form,
        genericName: draft.genericName.trim() || undefined,
      });
      recentCache = null;
      pick(res.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(optionCount - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && optionCount > 0 && !(value && query === value.name)) {
      e.preventDefault();
      e.stopPropagation();
      if (active < items.length) pick(items[active]);
      else startAdd();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setAdding(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <input
        ref={inputRef}
        data-rx-field
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t('Medicine')}
        placeholder={t('Search medicine (brand or generic)')}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setAdding(false);
          if (value?.medicineId) onClear();
        }}
        onKeyDown={onKeyDown}
        className={`glass-input w-full font-semibold ${value?.medicineId ? 'text-[var(--pr-ink)]' : ''}`}
        autoComplete="off"
      />

      {open && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-md border border-[var(--pr-line-strong)] bg-white shadow-lg">
          {adding ? (
            <div className="space-y-2 p-3" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.stopPropagation(), saveNew())}>
              <p className="text-xs font-semibold text-[var(--pr-ink-2)]">{t('Add a new medicine')}</p>
              <input autoFocus className="glass-input w-full" aria-label={t('Medicine name')} placeholder={t('Medicine name')} value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="glass-input" aria-label={t('Strength')} placeholder={t('Strength (e.g. 500 mg)')} value={draft.strength} onChange={(e) => setDraft({ ...draft, strength: e.target.value })} />
                <select className="glass-input" aria-label={t('Form')} value={draft.form} onChange={(e) => setDraft({ ...draft, form: e.target.value })}>
                  {MEDICINE_FORM_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {enumLabel(f)}
                    </option>
                  ))}
                </select>
              </div>
              <input className="glass-input w-full" aria-label={t('Generic name (optional)')} placeholder={t('Generic name (optional)')} value={draft.genericName} onChange={(e) => setDraft({ ...draft, genericName: e.target.value })} />
              {error && <p className="text-xs text-[var(--pr-danger)]">{error}</p>}
              <p className="text-[11px] text-[var(--pr-muted)]">{t('Only you will see this medicine until an administrator reviews it.')}</p>
              <div className="flex justify-end gap-2">
                <button type="button" className="pr-btn" onClick={() => setAdding(false)}>
                  {t('Cancel')}
                </button>
                <button type="button" className="pr-btn pr-btn-primary" onClick={saveNew}>
                  {t('Add medicine')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {showingRecent && items.length > 0 && <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--pr-muted)]">{t('Favourites and recent')}</p>}
              {loading && (
                <p className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--pr-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> {t('Searching…')}
                </p>
              )}
              {items.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(m)}
                  className={`block w-full px-3 py-2 text-left ${i === active ? 'bg-[var(--pr-primary-tint)]' : ''}`}
                >
                  <span className="flex items-center gap-1.5 text-sm">
                    {m.favourite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />}
                    <strong className="font-semibold">{m.brandName}</strong>
                    {m.strength && <span className="text-[var(--pr-muted)]">{m.strength}</span>}
                    {m.scope === 'doctor_private' && <span className="ml-auto rounded bg-[var(--pr-hover)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pr-ink-2)]">{t('Added by you')}</span>}
                  </span>
                  <span className="block truncate text-xs text-[var(--pr-muted)]">
                    {[m.form ? enumLabel(m.form) : null, m.genericName].filter(Boolean).join(' · ')}
                  </span>
                </button>
              ))}
              {!loading && !items.length && !canAdd && (
                <p className="px-3 py-2 text-xs text-[var(--pr-muted)]">{showingRecent ? t('Type to search the medicine list.') : t('No medicines found.')}</p>
              )}
              {canAdd && (
                <button
                  type="button"
                  role="option"
                  aria-selected={active === items.length}
                  onMouseEnter={() => setActive(items.length)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={startAdd}
                  className={`flex w-full items-center gap-2 border-t border-[var(--pr-line)] px-3 py-2 text-left text-sm font-semibold text-[var(--pr-primary)] ${active === items.length ? 'bg-[var(--pr-primary-tint)]' : ''}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('Add "{name}" as new medicine', { name: query.trim() })}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
