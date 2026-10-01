import type { LangCode } from '../context/LanguageContext.js';

/**
 * UI text is written in plain English at the call site: t('Save changes'). English needs no entry (the key is
 * the text); every other language is a row in ./translations/*.ts. At build time those tables become one small
 * dictionary per language (see the i18n-dictionaries plugin in vite.config.ts), and only the language the
 * visitor uses is downloaded. Untranslated text falls back to English. `npm run i18n:check` fails if a
 * t()/tn()/tr()/tx() string, server message or label has no translation.
 */
export const extraTranslations: Record<LangCode, Record<string, string>> = { en: {}, hi: {}, kn: {}, ta: {}, te: {} };

const loaders: Record<Exclude<LangCode, 'en'>, () => Promise<{ default: Record<string, string> }>> = {
  hi: () => import('virtual:i18n-dict/hi'),
  kn: () => import('virtual:i18n-dict/kn'),
  ta: () => import('virtual:i18n-dict/ta'),
  te: () => import('virtual:i18n-dict/te'),
};
const loaded = new Set<LangCode>(['en']);
const inflight = new Map<LangCode, Promise<void>>();

export const isLanguageLoaded = (lang: LangCode) => loaded.has(lang);

/** Fetch a language's dictionary once; resolves immediately when it is already here (or for English) */
export function loadLanguage(lang: LangCode): Promise<void> {
  if (loaded.has(lang) || !(lang in loaders)) return Promise.resolve();
  let p = inflight.get(lang);
  if (!p) {
    p = loaders[lang as Exclude<LangCode, 'en'>]()
      .then((m) => {
        extraTranslations[lang] = m.default;
        loaded.add(lang);
      })
      .finally(() => inflight.delete(lang));
    inflight.set(lang, p);
  }
  return p;
}

/**
 * Marks a module-level English string as translatable without translating it yet (identity function).
 * The place that displays the value must call t(value). Lets the checker see strings that live in data arrays.
 */
export const tx = <T extends string>(s: T): T => s;
