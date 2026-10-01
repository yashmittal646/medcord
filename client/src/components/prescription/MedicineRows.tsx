import React, { useRef } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { MedicineAutocomplete } from './MedicineAutocomplete.js';
import {
  DOSAGE_PRESETS,
  DURATION_UNITS,
  FREQUENCIES,
  RxMedicineLine,
  UNIT_LABELS,
  dosagePattern,
  half,
  newKey,
  suggestTiming,
} from './rx.js';

const emptyLine = (): RxMedicineLine => ({
  key: newKey(),
  medicineId: '',
  name: '',
  dosage: { morning: 0, afternoon: 0, night: 0 },
  frequency: 'DAILY',
  duration: { value: 5, unit: 'DAYS' },
});

/** "1", "0.5", ".5", "½", "1½", "1/2" -> number of tablets (0 when unreadable) */
export const parseDose = (raw: string) => {
  const s = raw.trim().replace(',', '.');
  if (!s) return 0;
  if (s === '½' || s === '1/2') return 0.5;
  const mixed = s.match(/^(\d)\s*(½|1\/2)$/);
  if (mixed) return Number(mixed[1]) + 0.5;
  const n = Number(s);
  return Number.isFinite(n) ? Math.min(4, Math.max(0, Math.round(n * 2) / 2)) : 0;
};

interface Props {
  rows: RxMedicineLine[];
  onChange: (rows: RxMedicineLine[]) => void;
}

/**
 * The medicine table. Enter moves to the next field (like Tab); Enter on the last field of the last row
 * adds a new row and puts the cursor in its medicine search.
 */
export const MedicineRows: React.FC<Props> = ({ rows, onChange }) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const focusNewRow = useRef(false);

  const update = (key: string, patch: Partial<RxMedicineLine>) =>
    onChange(
      rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (!next.timingEdited && (patch.dosage || patch.frequency)) next.timing = suggestTiming(next.dosage, next.frequency);
        return next;
      })
    );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const copy = [...rows];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const addRow = () => {
    focusNewRow.current = true;
    onChange([...rows, emptyLine()]);
  };

  // After a row is added from the keyboard, focus its medicine search
  React.useEffect(() => {
    if (!focusNewRow.current) return;
    focusNewRow.current = false;
    const inputs = containerRef.current?.querySelectorAll<HTMLInputElement>('[data-rx-row]:last-of-type [role="combobox"]');
    inputs?.[inputs.length - 1]?.focus();
  }, [rows.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (!target.matches('[data-rx-field]') || target.getAttribute('role') === 'combobox') return;
    e.preventDefault();
    const fields = [...(containerRef.current?.querySelectorAll<HTMLElement>('[data-rx-field]') ?? [])];
    const i = fields.indexOf(target);
    if (i >= 0 && i < fields.length - 1) fields[i + 1].focus();
    else addRow();
  };

  return (
    <div ref={containerRef} onKeyDown={onKeyDown} className="space-y-3">
      {rows.map((r, i) => {
        const total = r.dosage.morning + r.dosage.afternoon + r.dosage.night;
        return (
          <div key={r.key} data-rx-row className="rounded-md border border-[var(--pr-line)] bg-white p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <span className="mt-2.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-[var(--pr-muted)]">{i + 1})</span>
              <div className="min-w-0 flex-1">
                <MedicineAutocomplete
                  value={r.medicineId ? { medicineId: r.medicineId, name: r.name } : null}
                  onSelect={(m) =>
                    update(r.key, { medicineId: m.id, name: m.brandName, strength: m.strength, form: m.form, genericName: m.genericName })
                  }
                  onClear={() => update(r.key, { medicineId: '', name: '' })}
                />
                {r.medicineId && (r.strength || r.genericName) && (
                  <p className="mt-1 truncate text-xs text-[var(--pr-muted)]">{[r.strength, r.genericName].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-2 text-[var(--pr-muted)] hover:bg-[var(--pr-hover)] disabled:opacity-30" aria-label={t('Move up')}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="rounded-md p-2 text-[var(--pr-muted)] hover:bg-[var(--pr-hover)] disabled:opacity-30" aria-label={t('Move down')}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onChange(rows.filter((x) => x.key !== r.key))} className="rounded-md p-2 text-[var(--pr-muted)] hover:bg-[var(--pr-danger-tint)] hover:text-[var(--pr-danger)]" aria-label={t('Remove medicine')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 pl-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-2">
              {/* Dosage: morning - afternoon - night */}
              <fieldset className="min-w-0">
                <legend className="mb-1 text-xs font-semibold text-[var(--pr-ink-2)]">{t('Dosage (M-A-N)')}</legend>
                <div className="flex items-center gap-1">
                  {(['morning', 'afternoon', 'night'] as const).map((slot, si) => (
                    <React.Fragment key={slot}>
                      {si > 0 && <span className="text-[var(--pr-muted)]">-</span>}
                      <input
                        data-rx-field
                        inputMode="decimal"
                        aria-label={t(slot === 'morning' ? 'Morning' : slot === 'afternoon' ? 'Afternoon' : 'Night')}
                        className="glass-input !w-12 !px-1 text-center font-mono"
                        defaultValue={half(r.dosage[slot])}
                        key={`${r.key}-${slot}-${r.dosage[slot]}`}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                          const n = parseDose(e.target.value);
                          if (n !== r.dosage[slot]) update(r.key, { dosage: { ...r.dosage, [slot]: n } });
                          else e.target.value = half(n);
                        }}
                      />
                    </React.Fragment>
                  ))}
                  <select
                    aria-label={t('Quick dosage')}
                    className="glass-input ml-1 !w-[5.75rem] !px-2 text-xs"
                    value=""
                    onChange={(e) => {
                      const [m, a, n] = e.target.value.split('-').map(Number);
                      update(r.key, { dosage: { morning: m, afternoon: a, night: n } });
                    }}
                  >
                    <option value="">{dosagePattern(r.dosage)}</option>
                    {DOSAGE_PRESETS.map((p) => (
                      <option key={p.join('-')} value={p.join('-')}>
                        {p.join('-')}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {/* Frequency */}
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-[var(--pr-ink-2)]" htmlFor={`f-${r.key}`}>
                  {t('Frequency')}
                </label>
                <select
                  id={`f-${r.key}`}
                  data-rx-field
                  className="glass-input w-full"
                  value={r.frequency}
                  onChange={(e) => update(r.key, { frequency: e.target.value as RxMedicineLine['frequency'] })}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {t(f.label)}
                    </option>
                  ))}
                </select>
                {r.frequency === 'CUSTOM' && (
                  <input
                    data-rx-field
                    className="glass-input mt-1.5 w-full"
                    placeholder={t('e.g. Twice a week')}
                    aria-label={t('Custom frequency')}
                    value={r.frequencyCustom ?? ''}
                    onChange={(e) => update(r.key, { frequencyCustom: e.target.value })}
                  />
                )}
              </div>

              {/* Duration */}
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-[var(--pr-ink-2)]" htmlFor={`d-${r.key}`}>
                  {t('Duration')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    id={`d-${r.key}`}
                    data-rx-field
                    inputMode="numeric"
                    className="glass-input !w-16 !px-1 text-center"
                    value={r.duration?.value ?? ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      update(r.key, { duration: Number.isFinite(v) && v > 0 ? { value: Math.min(v, 365), unit: r.duration?.unit ?? 'DAYS' } : null });
                    }}
                  />
                  <select
                    data-rx-field
                    aria-label={t('Duration unit')}
                    className="glass-input min-w-0 flex-1"
                    value={r.duration?.unit ?? 'DAYS'}
                    onChange={(e) => update(r.key, { duration: { value: r.duration?.value ?? 1, unit: e.target.value as any } })}
                  >
                    {DURATION_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {t(UNIT_LABELS[u.value])}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 pl-8 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-[var(--pr-ink-2)]" htmlFor={`t-${r.key}`}>
                  {t('Timing')} <span className="font-normal text-[var(--pr-muted)]">({t('optional')})</span>
                </label>
                <input
                  id={`t-${r.key}`}
                  data-rx-field
                  className="glass-input w-full"
                  placeholder={t('e.g. Before meals, With bath')}
                  value={r.timing ?? ''}
                  onChange={(e) => update(r.key, { timing: e.target.value, timingEdited: true })}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-[var(--pr-ink-2)]" htmlFor={`n-${r.key}`}>
                  {t('Note')} <span className="font-normal text-[var(--pr-muted)]">({t('optional')})</span>
                </label>
                <input
                  id={`n-${r.key}`}
                  data-rx-field
                  className="glass-input w-full"
                  placeholder={t('e.g. One hour before head wash')}
                  value={r.note ?? ''}
                  onChange={(e) => update(r.key, { note: e.target.value })}
                />
              </div>
            </div>
            {r.medicineId && r.frequency !== 'SOS' && total === 0 && (
              <p className="mt-2 pl-8 text-xs font-medium text-[var(--pr-warn)]">{t('Set a dosage, for example 1-0-1.')}</p>
            )}
          </div>
        );
      })}

      <button type="button" onClick={addRow} className="pr-btn w-full justify-center border-dashed">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('Add medicine')}
      </button>
    </div>
  );
};

export { emptyLine };
