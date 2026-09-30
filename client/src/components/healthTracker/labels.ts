import { getLocale, tr } from '../../context/LanguageContext.js';
import { tx } from '../../i18n/index.js';

/** Lab groups used to filter the tracker (keys come from the API's lab catalog) */
export const GROUP_LABELS: Record<string, string> = {
  DIABETES: tx('Blood Sugar'),
  LIPIDS: tx('Cholesterol'),
  VITAMINS: tx('Vitamins'),
  BLOOD_COUNT: tx('Blood Count'),
  KIDNEY: tx('Kidney'),
  LIVER: tx('Liver'),
  THYROID: tx('Thyroid'),
  MINERALS: tx('Iron & Minerals'),
  INFLAMMATION: tx('Inflammation'),
  OTHER: tx('Other Tests'),
};

/**
 * Names of the catalog parameters, listed so the translation check covers them. Names the AI read off a
 * report for tests outside the catalog are shown exactly as printed.
 */
export const PARAMETER_NAMES = [
  tx('Fasting Blood Sugar'), tx('Post-meal Blood Sugar'), tx('Random Blood Sugar'), tx('HbA1c'),
  tx('Total Cholesterol'), tx('LDL Cholesterol'), tx('HDL Cholesterol'), tx('Triglycerides'), tx('VLDL Cholesterol'),
  tx('Vitamin D'), tx('Vitamin B12'), tx('Folate'),
  tx('Hemoglobin'), tx('White Blood Cells'), tx('Red Blood Cells'), tx('Platelets'), tx('Hematocrit'), tx('MCV'),
  tx('ESR'), tx('C-Reactive Protein'),
  tx('Creatinine'), tx('Blood Urea'), tx('Blood Urea Nitrogen'), tx('Uric Acid'), tx('eGFR'),
  tx('ALT (SGPT)'), tx('AST (SGOT)'), tx('Alkaline Phosphatase'), tx('Total Bilirubin'), tx('Albumin'),
  tx('TSH'), tx('T3'), tx('T4'), tx('Free T4'),
  tx('Serum Iron'), tx('Ferritin'), tx('Calcium'), tx('Sodium'), tx('Potassium'),
];
const KNOWN = new Set<string>(PARAMETER_NAMES);

export const groupLabel = (group: string) => tr(GROUP_LABELS[group] ?? GROUP_LABELS.OTHER);

/** Catalog parameters are translated; custom (report-printed) names are left as they are */
export const parameterLabel = (name: string, custom?: boolean) => (!custom && KNOWN.has(name) ? tr(name) : name);

export type LabFlag = 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';

export const FLAG_STYLES: Record<LabFlag, { label: string; pill: string; dot: string; text: string }> = {
  LOW: { label: tx('Low'), pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: '#f59e0b', text: 'text-amber-700' },
  HIGH: { label: tx('High'), pill: 'bg-rose-50 text-rose-700 border-rose-200', dot: '#f43f5e', text: 'text-rose-700' },
  NORMAL: { label: tx('Normal'), pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981', text: 'text-emerald-700' },
  UNKNOWN: { label: tx('No range'), pill: 'bg-slate-50 text-slate-600 border-slate-200', dot: '#64748b', text: 'text-slate-600' },
};

/** "70 – 99 mg/dL", "< 200 mg/dL", "> 40 mg/dL" */
export const formatRange = (range: { low?: number; high?: number }, unit: string) => {
  const u = unit ? ` ${unit}` : '';
  if (range.low !== undefined && range.high !== undefined) return `${fmt(range.low)} – ${fmt(range.high)}${u}`;
  if (range.high !== undefined) return `< ${fmt(range.high)}${u}`;
  if (range.low !== undefined) return `> ${fmt(range.low)}${u}`;
  return '';
};

export const fmt = (n: number) => {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return Number(n.toFixed(digits)).toLocaleString(getLocale(), { maximumFractionDigits: digits });
};
