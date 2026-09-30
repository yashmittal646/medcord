import { tr } from '../context/LanguageContext.js';
import { tx } from '../i18n/index.js';

/**
 * Turns an API enum value into a translated label: LIFE_THREATENING -> "Life Threatening" -> (Hindi, Tamil, ...).
 * Values that are not ALL_CAPS (free text, blood groups like "A+") are passed through the translator unchanged.
 * Every label this can produce must be listed in i18n/labels.ts so the completeness check covers it.
 */
const SPECIAL: Record<string, string> = { OBGYN: tx('Obstetrics & Gynecology'), ENT: 'ENT', ECG: 'ECG', HIV: 'HIV', COPD: 'COPD' };

export const enumLabel = (value?: string | null): string => {
  if (!value) return '';
  if (!/^[A-Z0-9_]+$/.test(value)) return tr(value);
  if (SPECIAL[value]) return tr(SPECIAL[value]);
  const pretty = value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return tr(pretty);
};
