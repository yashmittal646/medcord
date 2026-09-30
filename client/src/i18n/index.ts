import type { LangCode } from '../context/LanguageContext.js';
import type { Row } from './translations/types.js';

/**
 * UI text is written in plain English at the call site: t('Save changes'). English needs no entry (the key is
 * the text); every other language is a row in ./translations/*.ts, loaded automatically. Untranslated text
 * falls back to English. `npm run i18n:check` fails if a t()/tn()/tr()/tx() string, server message or label
 * has no translation.
 */
const modules = import.meta.glob<{ rows: Row[] }>('./translations/*.ts', { eager: true });
const ALL_ROWS: Row[] = Object.values(modules).flatMap((m) => m.rows ?? []);

const build = (col: 1 | 2 | 3 | 4): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const row of ALL_ROWS) if (row[col]) out[row[0]] = row[col];
  return out;
};

export const extraTranslations: Record<LangCode, Record<string, string>> = {
  en: {},
  hi: build(1),
  kn: build(2),
  ta: build(3),
  te: build(4),
};

/**
 * Marks a module-level English string as translatable without translating it yet (identity function).
 * The place that displays the value must call t(value). Lets the checker see strings that live in data arrays.
 */
export const tx = <T extends string>(s: T): T => s;
