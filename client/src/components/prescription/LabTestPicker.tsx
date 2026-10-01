import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { RxLabLine, newKey } from './rx.js';

interface TestOption {
  id: string;
  name: string;
  category: string;
  custom?: boolean;
}

/** Search the investigations list or type a custom test; each test can carry a note */
export const LabTestPicker: React.FC<{ tests: RxLabLine[]; onChange: (t: RxLabLine[]) => void }> = ({ tests, onChange }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TestOption[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      api
        .searchLabTests(query.trim())
        .then((r) => {
          setOptions(r.data ?? []);
          setActive(0);
        })
        .catch(() => setOptions([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const taken = new Set(tests.map((x) => x.name.toLowerCase()));
  const visible = options.filter((o) => !taken.has(o.name.toLowerCase()));
  const exact = visible.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());
  const canCustom = query.trim().length >= 2 && !exact && !taken.has(query.trim().toLowerCase());

  const add = (line: Omit<RxLabLine, 'key'>) => {
    onChange([...tests, { key: newKey(), ...line }]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {tests.map((x, i) => (
        <div key={x.key} className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--pr-line)] bg-white px-3 py-2">
          <span className="w-6 text-sm tabular-nums text-[var(--pr-muted)]">{i + 1}.</span>
          <span className="min-w-[8rem] flex-1 text-sm font-semibold">{x.name}</span>
          <input
            className="glass-input min-w-0 flex-[2]"
            placeholder={t('Note, e.g. Fasting 8-10 hrs')}
            aria-label={t('Note for {test}', { test: x.name })}
            value={x.note ?? ''}
            onChange={(e) => onChange(tests.map((y) => (y.key === x.key ? { ...y, note: e.target.value } : y)))}
          />
          <button type="button" onClick={() => onChange(tests.filter((y) => y.key !== x.key))} className="rounded-md p-2 text-[var(--pr-muted)] hover:bg-[var(--pr-danger-tint)] hover:text-[var(--pr-danger)]" aria-label={t('Remove test')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div ref={wrapRef} className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-label={t('Add a lab test')}
          placeholder={t('Search tests (CBC, HbA1c, X-ray…) or type a new one')}
          className="glass-input w-full"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            const count = visible.length + (canCustom ? 1 : 0);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, count - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (active < visible.length && visible[active]) add({ labTestId: visible[active].id, name: visible[active].name });
              else if (canCustom) add({ name: query.trim() });
            } else if (e.key === 'Escape') setOpen(false);
          }}
          autoComplete="off"
        />
        {open && (visible.length > 0 || canCustom) && (
          <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-[var(--pr-line-strong)] bg-white shadow-lg">
            {visible.slice(0, 40).map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add({ labTestId: o.id, name: o.name })}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${i === active ? 'bg-[var(--pr-primary-tint)]' : ''}`}
              >
                <span>{o.name}</span>
                <span className="text-xs text-[var(--pr-muted)]">{o.custom ? t('Added by you') : t(o.category)}</span>
              </button>
            ))}
            {canCustom && (
              <button
                type="button"
                role="option"
                aria-selected={active === visible.length}
                onMouseEnter={() => setActive(visible.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add({ name: query.trim() })}
                className={`flex w-full items-center gap-2 border-t border-[var(--pr-line)] px-3 py-2 text-left text-sm font-semibold text-[var(--pr-primary)] ${active === visible.length ? 'bg-[var(--pr-primary-tint)]' : ''}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('Add "{name}" as a custom test', { name: query.trim() })}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
