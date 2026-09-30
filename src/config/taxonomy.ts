/**
 * Single source of truth for record classification and doctor specializations.
 *
 * The LLM / upload form only ever picks from CONDITION_ROUTING keys and RECORD_CATEGORIES.
 * Which specializations may see a record is derived here, deterministically, never by the model.
 */

export const SPECIALIZATIONS = [
  'GENERAL_PRACTICE',
  'CARDIOLOGY',
  'ENDOCRINOLOGY',
  'NEPHROLOGY',
  'NEUROLOGY',
  'DERMATOLOGY',
  'ONCOLOGY',
  'ORTHOPEDICS',
  'PSYCHIATRY',
  'GASTROENTEROLOGY',
  'PULMONOLOGY',
  'RADIOLOGY',
  'OBGYN',
  'ENT',
  'OPHTHALMOLOGY',
  'UROLOGY',
  'PEDIATRICS',
  'EMERGENCY_MEDICINE',
] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

export const RECORD_CATEGORIES = [
  'BLOOD_WORK',
  'IMAGING',
  'PRESCRIPTION',
  'BIOPSY_PATHOLOGY',
  'CARDIAC_TEST',
  'DISCHARGE_SUMMARY',
  'CONSULTATION',
  'VACCINATION',
  'OTHER',
] as const;
export type RecordCategory = (typeof RECORD_CATEGORIES)[number];

export const SENSITIVITY_LEVELS = ['STANDARD', 'HIGHLY_CONFIDENTIAL'] as const;
export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

export const CLASSIFICATION_SOURCES = ['AI', 'UPLOADER_FORM', 'PATIENT_OVERRIDE', 'UNCLASSIFIED'] as const;
export type ClassificationSource = (typeof CLASSIFICATION_SOURCES)[number];

const GP: Specialization = 'GENERAL_PRACTICE';

interface ConditionRule {
  label: string;
  specs: Specialization[];
  sensitive?: boolean;
}

/** condition key -> label, specializations that may see it, and whether it is highly confidential */
export const CONDITION_ROUTING: Record<string, ConditionRule> = {
  // Cardiac
  arrhythmia: { label: 'Arrhythmia', specs: ['CARDIOLOGY', GP] },
  ecg: { label: 'ECG', specs: ['CARDIOLOGY', GP] },
  hypertension: { label: 'Hypertension', specs: ['CARDIOLOGY', 'NEPHROLOGY', GP] },
  heart_failure: { label: 'Heart failure', specs: ['CARDIOLOGY', 'PULMONOLOGY', GP] },
  coronary_artery_disease: { label: 'Coronary artery disease', specs: ['CARDIOLOGY', GP] },
  cholesterol: { label: 'High cholesterol / lipid profile', specs: ['CARDIOLOGY', 'ENDOCRINOLOGY', GP] },
  // Metabolic / endocrine
  type1_diabetes: { label: 'Type 1 diabetes', specs: ['ENDOCRINOLOGY', 'NEPHROLOGY', 'OPHTHALMOLOGY', GP] },
  type2_diabetes: { label: 'Type 2 diabetes', specs: ['ENDOCRINOLOGY', 'NEPHROLOGY', 'OPHTHALMOLOGY', GP] },
  thyroid_disorder: { label: 'Thyroid disorder', specs: ['ENDOCRINOLOGY', GP] },
  obesity: { label: 'Obesity', specs: ['ENDOCRINOLOGY', GP] },
  // Renal / urology
  kidney_function: { label: 'Kidney function', specs: ['NEPHROLOGY', GP] },
  chronic_kidney_disease: { label: 'Chronic kidney disease', specs: ['NEPHROLOGY', 'CARDIOLOGY', GP] },
  kidney_stones: { label: 'Kidney stones', specs: ['UROLOGY', 'NEPHROLOGY', GP] },
  // Neuro
  epilepsy: { label: 'Epilepsy', specs: ['NEUROLOGY', GP] },
  migraine: { label: 'Migraine', specs: ['NEUROLOGY', GP] },
  stroke: { label: 'Stroke', specs: ['NEUROLOGY', 'CARDIOLOGY', GP] },
  // Skin (strict: no GP)
  skin_biopsy: { label: 'Skin biopsy', specs: ['DERMATOLOGY', 'ONCOLOGY'] },
  eczema: { label: 'Eczema / dermatitis', specs: ['DERMATOLOGY', GP] },
  psoriasis: { label: 'Psoriasis', specs: ['DERMATOLOGY', GP] },
  // Oncology
  cancer: { label: 'Cancer', specs: ['ONCOLOGY', GP] },
  tumor_biopsy: { label: 'Tumor biopsy', specs: ['ONCOLOGY'] },
  // Musculoskeletal
  fracture: { label: 'Fracture', specs: ['ORTHOPEDICS', 'RADIOLOGY', GP] },
  arthritis: { label: 'Arthritis', specs: ['ORTHOPEDICS', GP] },
  back_pain: { label: 'Back / spine pain', specs: ['ORTHOPEDICS', 'NEUROLOGY', GP] },
  // Respiratory
  asthma: { label: 'Asthma', specs: ['PULMONOLOGY', GP] },
  copd: { label: 'COPD', specs: ['PULMONOLOGY', 'CARDIOLOGY', GP] },
  tuberculosis: { label: 'Tuberculosis', specs: ['PULMONOLOGY', GP] },
  // GI
  gerd: { label: 'GERD / acid reflux', specs: ['GASTROENTEROLOGY', GP] },
  liver_disease: { label: 'Liver disease', specs: ['GASTROENTEROLOGY', GP] },
  ibs: { label: 'Irritable bowel syndrome', specs: ['GASTROENTEROLOGY', GP] },
  // Senses
  vision_disorder: { label: 'Vision disorder', specs: ['OPHTHALMOLOGY', GP] },
  hearing_loss: { label: 'Hearing loss', specs: ['ENT', GP] },
  sinusitis: { label: 'Sinusitis', specs: ['ENT', GP] },
  // Infection / general
  anemia: { label: 'Anemia', specs: [GP, 'GASTROENTEROLOGY'] },
  infection: { label: 'Infection', specs: [GP] },
  allergy: { label: 'Allergy', specs: [GP] },
  // Highly confidential
  depression: { label: 'Depression', specs: ['PSYCHIATRY'], sensitive: true },
  anxiety: { label: 'Anxiety', specs: ['PSYCHIATRY'], sensitive: true },
  substance_use: { label: 'Substance use', specs: ['PSYCHIATRY'], sensitive: true },
  hiv: { label: 'HIV', specs: [], sensitive: true },
  sti: { label: 'Sexually transmitted infection', specs: [], sensitive: true },
  pregnancy: { label: 'Pregnancy / prenatal', specs: ['OBGYN'], sensitive: true },
  reproductive_health: { label: 'Reproductive health', specs: ['OBGYN'], sensitive: true },
  genetic_testing: { label: 'Genetic testing', specs: [], sensitive: true },
};

/** Specializations that may see a record purely because of its category (in addition to condition routing) */
export const CATEGORY_DEFAULTS: Record<RecordCategory, Specialization[]> = {
  BLOOD_WORK: [GP],
  IMAGING: ['RADIOLOGY', GP],
  PRESCRIPTION: [GP],
  BIOPSY_PATHOLOGY: ['ONCOLOGY'],
  CARDIAC_TEST: ['CARDIOLOGY', GP],
  DISCHARGE_SUMMARY: [GP],
  CONSULTATION: [GP],
  VACCINATION: [GP],
  OTHER: [],
};

/** Legacy `recordType` values -> classification category */
export const RECORD_TYPE_TO_CATEGORY: Record<string, RecordCategory> = {
  PRESCRIPTION: 'PRESCRIPTION',
  LAB_REPORT: 'BLOOD_WORK',
  CONSULTATION: 'CONSULTATION',
  CHECKUP: 'CONSULTATION',
  OTHER: 'OTHER',
};

export interface DerivedClassification {
  category: RecordCategory;
  associatedConditions: string[];
  targetSpecializations: Specialization[];
  sensitivityLevel: SensitivityLevel;
}

export function normalizeConditionKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Splits a list of raw condition strings into taxonomy keys and unrecognised free text */
export function splitConditions(raw: string[]): { known: string[]; unknown: string[] } {
  const known = new Set<string>();
  const unknown: string[] = [];
  for (const item of raw) {
    const key = normalizeConditionKey(item);
    if (!key) continue;
    if (CONDITION_ROUTING[key]) known.add(key);
    else unknown.push(item.trim());
  }
  return { known: [...known], unknown };
}

export function deriveClassification(input: {
  category: RecordCategory;
  conditions: string[];
  forceSensitive?: boolean;
  extraSpecializations?: Specialization[];
}): DerivedClassification {
  const known = input.conditions.filter((c) => CONDITION_ROUTING[c]);
  const specs = new Set<Specialization>(CATEGORY_DEFAULTS[input.category] ?? []);
  for (const key of known) CONDITION_ROUTING[key].specs.forEach((s) => specs.add(s));
  (input.extraSpecializations ?? []).forEach((s) => specs.add(s));

  const sensitive = Boolean(input.forceSensitive) || known.some((c) => CONDITION_ROUTING[c].sensitive);
  return {
    category: input.category,
    associatedConditions: known,
    targetSpecializations: [...specs],
    sensitivityLevel: sensitive ? 'HIGHLY_CONFIDENTIAL' : 'STANDARD',
  };
}

const SPEC_ALIASES: Record<string, Specialization> = {
  GENERAL_MEDICINE: 'GENERAL_PRACTICE',
  GENERAL_PHYSICIAN: 'GENERAL_PRACTICE',
  GP: 'GENERAL_PRACTICE',
  FAMILY_MEDICINE: 'GENERAL_PRACTICE',
  INTERNAL_MEDICINE: 'GENERAL_PRACTICE',
  CARDIOLOGIST: 'CARDIOLOGY',
  DERMATOLOGIST: 'DERMATOLOGY',
  NEUROLOGIST: 'NEUROLOGY',
  ORTHOPAEDICS: 'ORTHOPEDICS',
  ORTHOPEDIC: 'ORTHOPEDICS',
  GYNECOLOGY: 'OBGYN',
  GYNAECOLOGY: 'OBGYN',
  OBSTETRICS: 'OBGYN',
  ENT_SPECIALIST: 'ENT',
  EYE: 'OPHTHALMOLOGY',
  PSYCHIATRIST: 'PSYCHIATRY',
};

/** Maps free-text / legacy specialization strings onto the enum. Returns undefined when unrecognised. */
export function normalizeSpecialization(raw?: string | null): Specialization | undefined {
  if (!raw) return undefined;
  const key = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if ((SPECIALIZATIONS as readonly string[]).includes(key)) return key as Specialization;
  return SPEC_ALIASES[key];
}

export function getPublicTaxonomy() {
  return {
    specializations: SPECIALIZATIONS,
    categories: RECORD_CATEGORIES,
    sensitivityLevels: SENSITIVITY_LEVELS,
    categoryDefaults: CATEGORY_DEFAULTS,
    conditions: Object.entries(CONDITION_ROUTING).map(([key, r]) => ({
      key,
      label: r.label,
      sensitive: Boolean(r.sensitive),
      specs: r.specs,
    })),
  };
}
