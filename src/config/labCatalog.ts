/**
 * Common lab parameters the Health Tracker recognises. A value pulled from a report (or typed in by the
 * patient) is matched to one of these by name/alias so readings from different labs line up on one chart,
 * converted to the canonical unit, and flagged against the reference range. Anything not listed here is
 * still tracked as a custom parameter using the range printed on the report.
 *
 * Reference ranges are typical adult ranges for flagging only; a lab's own printed range takes precedence.
 */

export const LAB_GROUPS = [
  'DIABETES',
  'LIPIDS',
  'VITAMINS',
  'BLOOD_COUNT',
  'KIDNEY',
  'LIVER',
  'THYROID',
  'MINERALS',
  'INFLAMMATION',
  'OTHER',
] as const;
export type LabGroup = (typeof LAB_GROUPS)[number];

export interface LabRange {
  low?: number;
  high?: number;
}

export interface LabParameter {
  key: string;
  name: string;
  group: LabGroup;
  unit: string;
  range: LabRange;
  /** Sex-specific ranges override `range` when the patient's gender is known */
  rangeBySex?: { MALE?: LabRange; FEMALE?: LabRange };
  aliases: string[];
  /** Other units a report may use: value_in_canonical = value * factor (+ offset) */
  conversions?: Record<string, { factor: number; offset?: number }>;
}

export const LAB_CATALOG: LabParameter[] = [
  // Diabetes
  {
    key: 'GLUCOSE_FASTING', name: 'Fasting Blood Sugar', group: 'DIABETES', unit: 'mg/dL', range: { low: 70, high: 99 },
    aliases: ['fasting blood sugar', 'fbs', 'fasting glucose', 'fasting plasma glucose', 'fpg', 'glucose fasting', 'blood sugar fasting', 'plasma glucose fasting', 'blood glucose fasting'],
    conversions: { 'mmol/l': { factor: 18.016 } },
  },
  {
    key: 'GLUCOSE_PP', name: 'Post-meal Blood Sugar', group: 'DIABETES', unit: 'mg/dL', range: { high: 140 },
    aliases: ['post prandial blood sugar', 'postprandial glucose', 'ppbs', 'pp blood sugar', 'glucose pp', 'blood sugar pp', 'post prandial glucose', 'glucose post prandial', '2 hr post prandial glucose', 'plasma glucose pp'],
    conversions: { 'mmol/l': { factor: 18.016 } },
  },
  {
    key: 'GLUCOSE_RANDOM', name: 'Random Blood Sugar', group: 'DIABETES', unit: 'mg/dL', range: { low: 70, high: 140 },
    aliases: ['random blood sugar', 'rbs', 'random glucose', 'glucose random', 'blood glucose', 'glucose', 'blood sugar', 'plasma glucose'],
    conversions: { 'mmol/l': { factor: 18.016 } },
  },
  {
    key: 'HBA1C', name: 'HbA1c', group: 'DIABETES', unit: '%', range: { low: 4, high: 5.6 },
    aliases: ['hba1c', 'glycated haemoglobin', 'glycated hemoglobin', 'glycosylated hemoglobin', 'glycosylated haemoglobin', 'a1c', 'hemoglobin a1c', 'haemoglobin a1c'],
    conversions: { 'mmol/mol': { factor: 0.09148, offset: 2.152 } },
  },

  // Lipids
  {
    key: 'CHOLESTEROL_TOTAL', name: 'Total Cholesterol', group: 'LIPIDS', unit: 'mg/dL', range: { high: 200 },
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol', 'serum cholesterol', 't chol'],
    conversions: { 'mmol/l': { factor: 38.67 } },
  },
  {
    key: 'LDL', name: 'LDL Cholesterol', group: 'LIPIDS', unit: 'mg/dL', range: { high: 100 },
    aliases: ['ldl', 'ldl cholesterol', 'ldl c', 'low density lipoprotein', 'ldl direct', 'ldl cholesterol direct', 'bad cholesterol'],
    conversions: { 'mmol/l': { factor: 38.67 } },
  },
  {
    key: 'HDL', name: 'HDL Cholesterol', group: 'LIPIDS', unit: 'mg/dL', range: { low: 40 }, rangeBySex: { MALE: { low: 40 }, FEMALE: { low: 50 } },
    aliases: ['hdl', 'hdl cholesterol', 'hdl c', 'high density lipoprotein', 'hdl direct', 'good cholesterol'],
    conversions: { 'mmol/l': { factor: 38.67 } },
  },
  {
    key: 'TRIGLYCERIDES', name: 'Triglycerides', group: 'LIPIDS', unit: 'mg/dL', range: { high: 150 },
    aliases: ['triglycerides', 'triglyceride', 'tg', 'serum triglycerides'],
    conversions: { 'mmol/l': { factor: 88.57 } },
  },
  {
    key: 'VLDL', name: 'VLDL Cholesterol', group: 'LIPIDS', unit: 'mg/dL', range: { low: 5, high: 40 },
    aliases: ['vldl', 'vldl cholesterol', 'very low density lipoprotein'],
    conversions: { 'mmol/l': { factor: 38.67 } },
  },

  // Vitamins
  {
    key: 'VITAMIN_D', name: 'Vitamin D', group: 'VITAMINS', unit: 'ng/mL', range: { low: 30, high: 100 },
    aliases: ['vitamin d', 'vit d', '25 oh vitamin d', '25 hydroxy vitamin d', 'vitamin d3', 'vitamin d total', '25 oh d', 'total 25 hydroxy vitamin d', 'vitamin d 25 hydroxy'],
    conversions: { 'nmol/l': { factor: 0.4006 } },
  },
  {
    key: 'VITAMIN_B12', name: 'Vitamin B12', group: 'VITAMINS', unit: 'pg/mL', range: { low: 200, high: 900 },
    aliases: ['vitamin b12', 'vit b12', 'b12', 'cobalamin', 'cyanocobalamin', 'serum b12'],
    conversions: { 'pmol/l': { factor: 1.355 } },
  },
  {
    key: 'FOLATE', name: 'Folate', group: 'VITAMINS', unit: 'ng/mL', range: { low: 3, high: 17 },
    aliases: ['folate', 'folic acid', 'serum folate', 'vitamin b9'],
    conversions: { 'nmol/l': { factor: 0.4413 } },
  },

  // Blood count
  {
    key: 'HEMOGLOBIN', name: 'Hemoglobin', group: 'BLOOD_COUNT', unit: 'g/dL', range: { low: 12, high: 17.5 },
    rangeBySex: { MALE: { low: 13.5, high: 17.5 }, FEMALE: { low: 12, high: 15.5 } },
    aliases: ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
    conversions: { 'g/l': { factor: 0.1 } },
  },
  {
    key: 'WBC', name: 'White Blood Cells', group: 'BLOOD_COUNT', unit: '×10³/µL', range: { low: 4, high: 11 },
    aliases: ['wbc', 'white blood cells', 'white blood cell count', 'total leucocyte count', 'total leukocyte count', 'tlc', 'wbc count', 'leukocytes'],
    conversions: { 'cells/µl': { factor: 0.001 }, '/µl': { factor: 0.001 }, 'cells/cumm': { factor: 0.001 }, '/cumm': { factor: 0.001 }, '×10^9/l': { factor: 1 }, '10^9/l': { factor: 1 } },
  },
  {
    key: 'RBC', name: 'Red Blood Cells', group: 'BLOOD_COUNT', unit: 'million/µL', range: { low: 4.2, high: 5.9 },
    rangeBySex: { MALE: { low: 4.5, high: 5.9 }, FEMALE: { low: 4.1, high: 5.1 } },
    aliases: ['rbc', 'red blood cells', 'red blood cell count', 'rbc count', 'erythrocytes', 'total rbc count'],
    conversions: { '×10^12/l': { factor: 1 }, '10^12/l': { factor: 1 } },
  },
  {
    key: 'PLATELETS', name: 'Platelets', group: 'BLOOD_COUNT', unit: '×10³/µL', range: { low: 150, high: 450 },
    aliases: ['platelets', 'platelet count', 'plt', 'thrombocytes'],
    conversions: { 'lakh/cumm': { factor: 100 }, 'lakhs/cumm': { factor: 100 }, 'cells/µl': { factor: 0.001 }, '/µl': { factor: 0.001 }, '/cumm': { factor: 0.001 }, '×10^9/l': { factor: 1 }, '10^9/l': { factor: 1 } },
  },
  {
    key: 'HEMATOCRIT', name: 'Hematocrit', group: 'BLOOD_COUNT', unit: '%', range: { low: 36, high: 50 },
    aliases: ['hematocrit', 'haematocrit', 'hct', 'pcv', 'packed cell volume'],
  },
  {
    key: 'MCV', name: 'MCV', group: 'BLOOD_COUNT', unit: 'fL', range: { low: 80, high: 100 },
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
  },
  {
    key: 'ESR', name: 'ESR', group: 'INFLAMMATION', unit: 'mm/hr', range: { high: 20 },
    aliases: ['esr', 'erythrocyte sedimentation rate', 'sed rate'],
  },
  {
    key: 'CRP', name: 'C-Reactive Protein', group: 'INFLAMMATION', unit: 'mg/L', range: { high: 5 },
    aliases: ['crp', 'c reactive protein', 'hs crp', 'hscrp', 'high sensitivity crp'],
    conversions: { 'mg/dl': { factor: 10 } },
  },

  // Kidney
  {
    key: 'CREATININE', name: 'Creatinine', group: 'KIDNEY', unit: 'mg/dL', range: { low: 0.6, high: 1.3 },
    rangeBySex: { MALE: { low: 0.7, high: 1.3 }, FEMALE: { low: 0.5, high: 1.1 } },
    aliases: ['creatinine', 'serum creatinine', 's creatinine', 'creat'],
    conversions: { 'µmol/l': { factor: 0.01131 }, 'umol/l': { factor: 0.01131 } },
  },
  {
    key: 'UREA', name: 'Blood Urea', group: 'KIDNEY', unit: 'mg/dL', range: { low: 15, high: 40 },
    aliases: ['urea', 'blood urea', 'serum urea'],
    conversions: { 'mmol/l': { factor: 6.006 } },
  },
  {
    key: 'BUN', name: 'Blood Urea Nitrogen', group: 'KIDNEY', unit: 'mg/dL', range: { low: 7, high: 20 },
    aliases: ['bun', 'blood urea nitrogen', 'urea nitrogen'],
    conversions: { 'mmol/l': { factor: 2.801 } },
  },
  {
    key: 'URIC_ACID', name: 'Uric Acid', group: 'KIDNEY', unit: 'mg/dL', range: { low: 3.5, high: 7.2 },
    rangeBySex: { MALE: { low: 3.5, high: 7.2 }, FEMALE: { low: 2.6, high: 6 } },
    aliases: ['uric acid', 'serum uric acid', 'urate'],
    conversions: { 'µmol/l': { factor: 0.01681 }, 'umol/l': { factor: 0.01681 } },
  },
  {
    key: 'EGFR', name: 'eGFR', group: 'KIDNEY', unit: 'mL/min/1.73m²', range: { low: 90 },
    aliases: ['egfr', 'estimated gfr', 'estimated glomerular filtration rate', 'gfr'],
  },

  // Liver
  {
    key: 'ALT', name: 'ALT (SGPT)', group: 'LIVER', unit: 'U/L', range: { high: 56 },
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alanine transaminase', 'alt sgpt', 'sgpt alt'],
  },
  {
    key: 'AST', name: 'AST (SGOT)', group: 'LIVER', unit: 'U/L', range: { high: 40 },
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'aspartate transaminase', 'ast sgot', 'sgot ast'],
  },
  {
    key: 'ALP', name: 'Alkaline Phosphatase', group: 'LIVER', unit: 'U/L', range: { low: 44, high: 147 },
    aliases: ['alp', 'alkaline phosphatase', 'alk phos'],
  },
  {
    key: 'BILIRUBIN_TOTAL', name: 'Total Bilirubin', group: 'LIVER', unit: 'mg/dL', range: { low: 0.1, high: 1.2 },
    aliases: ['total bilirubin', 'bilirubin total', 'bilirubin', 'serum bilirubin', 't bil'],
    conversions: { 'µmol/l': { factor: 0.05848 }, 'umol/l': { factor: 0.05848 } },
  },
  {
    key: 'ALBUMIN', name: 'Albumin', group: 'LIVER', unit: 'g/dL', range: { low: 3.5, high: 5 },
    aliases: ['albumin', 'serum albumin'],
    conversions: { 'g/l': { factor: 0.1 } },
  },

  // Thyroid
  {
    key: 'TSH', name: 'TSH', group: 'THYROID', unit: 'mIU/L', range: { low: 0.4, high: 4 },
    aliases: ['tsh', 'thyroid stimulating hormone', 'ultrasensitive tsh', 'tsh ultrasensitive', 'thyrotropin'],
    conversions: { 'µiu/ml': { factor: 1 }, 'uiu/ml': { factor: 1 }, 'miu/ml': { factor: 1000 } },
  },
  {
    key: 'T3', name: 'T3', group: 'THYROID', unit: 'ng/dL', range: { low: 80, high: 200 },
    aliases: ['t3', 'total t3', 'triiodothyronine', 't3 total'],
    conversions: { 'nmol/l': { factor: 65.1 }, 'ng/ml': { factor: 100 } },
  },
  {
    key: 'T4', name: 'T4', group: 'THYROID', unit: 'µg/dL', range: { low: 5, high: 12 },
    aliases: ['t4', 'total t4', 'thyroxine', 't4 total'],
    conversions: { 'nmol/l': { factor: 0.0777 } },
  },
  {
    key: 'FREE_T4', name: 'Free T4', group: 'THYROID', unit: 'ng/dL', range: { low: 0.8, high: 1.8 },
    aliases: ['free t4', 'ft4', 'free thyroxine'],
    conversions: { 'pmol/l': { factor: 0.0777 } },
  },

  // Minerals and iron
  {
    key: 'IRON', name: 'Serum Iron', group: 'MINERALS', unit: 'µg/dL', range: { low: 60, high: 170 },
    aliases: ['iron', 'serum iron', 'fe'],
    conversions: { 'µmol/l': { factor: 5.585 }, 'umol/l': { factor: 5.585 } },
  },
  {
    key: 'FERRITIN', name: 'Ferritin', group: 'MINERALS', unit: 'ng/mL', range: { low: 20, high: 250 },
    rangeBySex: { MALE: { low: 30, high: 400 }, FEMALE: { low: 15, high: 150 } },
    aliases: ['ferritin', 'serum ferritin'],
    conversions: { 'µg/l': { factor: 1 }, 'ug/l': { factor: 1 } },
  },
  {
    key: 'CALCIUM', name: 'Calcium', group: 'MINERALS', unit: 'mg/dL', range: { low: 8.5, high: 10.5 },
    aliases: ['calcium', 'serum calcium', 'total calcium', 'ca'],
    conversions: { 'mmol/l': { factor: 4.008 } },
  },
  {
    key: 'SODIUM', name: 'Sodium', group: 'MINERALS', unit: 'mmol/L', range: { low: 135, high: 145 },
    aliases: ['sodium', 'serum sodium', 'na'],
    conversions: { 'meq/l': { factor: 1 } },
  },
  {
    key: 'POTASSIUM', name: 'Potassium', group: 'MINERALS', unit: 'mmol/L', range: { low: 3.5, high: 5.1 },
    aliases: ['potassium', 'serum potassium', 'k'],
    conversions: { 'meq/l': { factor: 1 } },
  },
];

const BY_KEY = new Map(LAB_CATALOG.map((p) => [p.key, p]));

/** Lowercase, strip punctuation and filler words so "S. Creatinine (Serum)" matches "serum creatinine" */
export function normalizeLabName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()[\]{},.:;*_/\\-]+/g, ' ')
    .replace(/\b(level|levels|test|value|result|serum level)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALIAS_INDEX = new Map<string, LabParameter>();
for (const p of LAB_CATALOG) {
  for (const a of [p.name, p.key.replace(/_/g, ' '), ...p.aliases]) ALIAS_INDEX.set(normalizeLabName(a), p);
}

export function getLabParameter(key: string): LabParameter | undefined {
  return BY_KEY.get(key);
}

/** Find the catalog parameter a printed test name refers to (exact alias match, then containment) */
export function matchLabParameter(name: string): LabParameter | undefined {
  const n = normalizeLabName(name);
  if (!n) return undefined;
  const exact = ALIAS_INDEX.get(n);
  if (exact) return exact;
  // "Serum Vitamin B12 Level" or "Glucose - Fasting (Plasma)": a longer name containing a known multi-word
  // alias. Single short aliases (hb, k, na, ca, fe, tg) are too ambiguous to match by containment.
  let best: { p: LabParameter; len: number } | undefined;
  for (const [alias, p] of ALIAS_INDEX) {
    if (alias.length < 4 || !alias.includes(' ') && alias.length < 6) continue;
    if (` ${n} `.includes(` ${alias} `) && (!best || alias.length > best.len)) best = { p, len: alias.length };
  }
  return best?.p;
}

/**
 * Collapse spelling variants of a unit: "x10^3/uL", "×10³/µL" and "10^3/ul" all become "103/µl";
 * "umol/L" becomes "µmol/l" (a bare "u/l" enzyme unit is left alone).
 */
const normUnit = (u: string) =>
  u
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/μ/g, 'µ')
    .replace(/mcg/g, 'µg')
    .replace(/[×*]/g, '')
    .replace(/x(?=10)/g, '')
    .replace(/\^/g, '')
    .replace(/³/g, '3')
    .replace(/⁶/g, '6')
    .replace(/⁹/g, '9')
    .replace(/(^|\/)u(l|g|mol|iu)/g, '$1µ$2')
    .replace(/mm3|cmm/g, 'cumm');

/**
 * Convert a value to the parameter's canonical unit. Returns null when the unit is known to differ and
 * no conversion is defined (the reading is then kept in its own unit as a separate series).
 */
export function toCanonicalUnit(p: LabParameter, value: number, unit?: string | null): number | null {
  if (!unit) return value;
  const u = normUnit(unit);
  const canonical = normUnit(p.unit);
  if (u === canonical) return value;
  // Common spellings of the canonical unit (already passed through normUnit)
  const same: Record<string, string[]> = {
    'mg/dl': ['mg%', 'mg/100ml'],
    '103/µl': ['103/cumm', 'thousand/cumm', 'thousand/µl', 'k/µl', 'thou/µl', '109/l'],
    'million/µl': ['mill/cumm', 'million/cumm', '106/µl', 'mil/µl', '1012/l'],
    'miu/l': ['µiu/ml'],
    'fl': ['femtoliter'],
    'u/l': ['iu/l', 'units/l'],
    'ng/ml': ['µg/l'],
    'mmol/l': ['meq/l'],
  };
  if (same[canonical]?.includes(u)) return value;
  const conv = p.conversions && Object.entries(p.conversions).find(([k]) => normUnit(k) === u)?.[1];
  if (!conv) return null;
  return value * conv.factor + (conv.offset ?? 0);
}

export function rangeFor(p: LabParameter, gender?: string | null): LabRange {
  const g = gender === 'MALE' || gender === 'FEMALE' ? gender : undefined;
  return (g && p.rangeBySex?.[g]) || p.range;
}

export type LabFlag = 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';

export function flagValue(value: number, range: LabRange): LabFlag {
  if (range.low === undefined && range.high === undefined) return 'UNKNOWN';
  if (range.low !== undefined && value < range.low) return 'LOW';
  if (range.high !== undefined && value > range.high) return 'HIGH';
  return 'NORMAL';
}

/** Stable key for a parameter not in the catalog, e.g. "CUSTOM:homocysteine" */
export function customLabKey(name: string): string {
  return `CUSTOM:${normalizeLabName(name).replace(/\s+/g, '_').slice(0, 60)}`;
}
