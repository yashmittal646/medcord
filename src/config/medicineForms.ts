/** Dosage forms a medicine can come in (shared by the model, the importer and the API validators) */
export const MEDICINE_FORMS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'SUSPENSION',
  'SOLUTION',
  'DROPS',
  'INJECTION',
  'CREAM',
  'OINTMENT',
  'GEL',
  'LOTION',
  'SHAMPOO',
  'SPRAY',
  'INHALER',
  'POWDER',
  'SACHET',
  'SOAP',
  'SERUM',
  'KIT',
  'OTHER',
] as const;
export type MedicineForm = (typeof MEDICINE_FORMS)[number];

// Order matters: more specific words first ("eye drops" before "drops", "shampoo" before "solution")
const FORM_WORDS: [RegExp, MedicineForm][] = [
  [/\bkit\b/i, 'KIT'],
  [/\bshampoo\b/i, 'SHAMPOO'],
  [/\b(inhaler|rotacap|respule)s?\b/i, 'INHALER'],
  [/\bspray\b/i, 'SPRAY'],
  [/\b(drops?|eye ?drop|ear ?drop)\b/i, 'DROPS'],
  [/\b(injection|inj\.?|vial|ampoule)\b/i, 'INJECTION'],
  [/\b(suspension|susp\.?)\b/i, 'SUSPENSION'],
  [/\b(syrup|syp\.?|elixir|linctus)\b/i, 'SYRUP'],
  [/\b(solution|soln\.?|lotion|tonic)\b/i, 'SOLUTION'],
  [/\bserum\b/i, 'SERUM'],
  [/\bcream\b/i, 'CREAM'],
  [/\b(ointment|oint\.?)\b/i, 'OINTMENT'],
  [/\bgel\b/i, 'GEL'],
  [/\bsoap\b/i, 'SOAP'],
  [/\bsachets?\b/i, 'SACHET'],
  [/\b(powder|granules)\b/i, 'POWDER'],
  [/\b(capsules?|caps?\.?)\b/i, 'CAPSULE'],
  [/\b(tablets?|tabs?\.?)\b/i, 'TABLET'],
];

/** Map free text ("Tab.", "Eye Drops", "anti-dandruff shampoo") to a form; OTHER when nothing fits */
export function inferMedicineForm(...texts: (string | undefined | null)[]): MedicineForm {
  const joined = texts.filter(Boolean).join(' ');
  for (const [re, form] of FORM_WORDS) if (re.test(joined)) return form;
  // An explicit enum value such as "tablet" or "SHAMPOO"
  const upper = joined.trim().toUpperCase();
  return (MEDICINE_FORMS as readonly string[]).includes(upper) ? (upper as MedicineForm) : 'OTHER';
}

/** Strength printed inside a product name, e.g. "Paracetamol 500mg" -> "500 mg", "Minoxidil 5%" -> "5%" */
export function extractStrength(name: string): string | undefined {
  const m = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ml|iu|% w\/v|% w\/w|%|g)(?:\s*\/\s*(\d+(?:\.\d+)?)\s*(ml|g|mg))?/i);
  if (!m) return undefined;
  const base = `${m[1]}${m[2] === '%' || m[2].startsWith('%') ? m[2] : ` ${m[2].toLowerCase()}`}`;
  return m[3] ? `${base}/${m[3]} ${m[4].toLowerCase()}` : base;
}
