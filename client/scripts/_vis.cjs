const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
function edit(file, pairs) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n/g, '\n');
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`${file}: no match ${from.slice(0, 70)}`);
    s = s.replace(from, () => to);
  }
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s);
}

// ── 1. Taxonomy helper: which categories a specialty sees by default ──
edit('src/config/taxonomy.ts', [[
  '/** Legacy `recordType` values -> classification category */',
  `/** Categories whose default audience includes this specialty (used for records nobody has tagged yet) */
export function categoriesVisibleTo(spec: Specialization): RecordCategory[] {
  return RECORD_CATEGORIES.filter((c) => CATEGORY_DEFAULTS[c].includes(spec));
}

/** Legacy \`recordType\` values -> classification category */`,
]]);

// ── 2. Access policy: untagged, non-confidential records follow their document type's default audience ──
edit('src/services/accessPolicy.service.ts', [
  [
    "    if (!c || c.source === 'UNCLASSIFIED') return deny('UNCLASSIFIED');\n    if (c.sensitivityLevel === 'HIGHLY_CONFIDENTIAL') return deny('SENSITIVE_REQUIRES_CONSENT');",
    `    if (c?.sensitivityLevel === 'HIGHLY_CONFIDENTIAL') return deny('SENSITIVE_REQUIRES_CONSENT');
    if (!c || c.source === 'UNCLASSIFIED') {
      // Not tagged yet: visible to the specialties its document type implies (e.g. lab report -> General Practice).
      // "Other" documents have no default audience and stay with the patient until tagged.
      const defaults = CATEGORY_DEFAULTS[(c?.category ?? 'OTHER') as RecordCategory] ?? [];
      return spec && defaults.includes(spec) ? allow('SPECIALIZATION', 'CATEGORY_DEFAULT') : deny('UNCLASSIFIED');
    }`,
  ],
  [
    `    if (spec) {
      or.push({
        'classification.targetSpecializations': spec,
        'classification.sensitivityLevel': { $ne: 'HIGHLY_CONFIDENTIAL' },
        'classification.source': { $nin: ['UNCLASSIFIED', null] },
      });
    }`,
    `    if (spec) {
      or.push({
        'classification.targetSpecializations': spec,
        'classification.sensitivityLevel': { $ne: 'HIGHLY_CONFIDENTIAL' },
        'classification.source': { $nin: ['UNCLASSIFIED', null] },
      });
      // Untagged records: same rule as evaluate() - the document type's default audience
      or.push({
        'classification.source': 'UNCLASSIFIED',
        'classification.sensitivityLevel': { $ne: 'HIGHLY_CONFIDENTIAL' },
        'classification.category': { $in: categoriesVisibleTo(spec) },
      });
    }`,
  ],
  [
    "import { normalizeSpecialization, Specialization } from '../config/taxonomy.js';",
    "import {\n  CATEGORY_DEFAULTS,\n  RecordCategory,\n  categoriesVisibleTo,\n  normalizeSpecialization,\n  Specialization,\n} from '../config/taxonomy.js';",
  ],
]);

// ── 3. Keyword tagger: treat "back-pain" / "back_pain" tags like "back pain" ──
edit('src/services/classification.service.ts', [
  [
    "    const strong = `${meta.title} ${meta.diagnosis ?? ''}`.toLowerCase();\n    const weak = `${meta.description ?? ''} ${meta.tags.join(' ')} ${meta.fileName ?? ''}`.toLowerCase();",
    "    const flat = (s: string) => s.toLowerCase().replace(/[-_]+/g, ' ');\n    const strong = flat(`${meta.title} ${meta.diagnosis ?? ''}`);\n    const weak = flat(`${meta.description ?? ''} ${meta.tags.join(' ')} ${meta.fileName ?? ''}`);",
  ],
  // ── 4. Startup backfill for records created before tagging existed ──
  [
    '  /** Runs after upload. Safe to call repeatedly: it only ever touches UNCLASSIFIED, unreviewed records. */',
    `  /**
   * Startup repair for records created before tagging existed. Gives legacy documents a classification
   * derived from their record type, then tags untagged records with the local keyword classifier (no LLM
   * call, so no record data leaves the server; no notifications). Idempotent and conditional: a patient's
   * own tags are never overwritten.
   */
  static async backfillLegacyRecords(): Promise<void> {
    let initialized = 0;
    for (const [recordType, category] of Object.entries(RECORD_TYPE_TO_CATEGORY)) {
      const res = await MedicalRecord.collection.updateMany(
        { recordType, 'classification.source': { $exists: false } },
        {
          $set: {
            classification: {
              category,
              associatedConditions: [],
              targetSpecializations: [],
              sensitivityLevel: 'STANDARD',
              source: 'UNCLASSIFIED',
              patientReviewed: false,
            },
          },
        }
      );
      initialized += res.modifiedCount;
    }

    let tagged = 0;
    const untagged = await MedicalRecord.find({
      'classification.source': 'UNCLASSIFIED',
      'classification.patientReviewed': { $ne: true },
    }).limit(5000);
    for (const record of untagged) {
      const s = this.keywordSuggest({
        title: record.title,
        recordType: record.recordType,
        description: record.description,
        diagnosis: record.diagnosis,
        tags: record.tags ?? [],
        facilityName: record.facilityName,
        doctorName: record.doctorName,
        fileName: record.file?.originalName,
      });
      if (s.confidence < AUTO_APPLY_CONFIDENCE || !s.conditions.length) continue;
      const category = s.category === 'OTHER' ? record.classification.category : s.category;
      const derived = deriveClassification({ category, conditions: s.conditions, forceSensitive: s.sensitive });
      const res = await MedicalRecord.updateOne(
        { _id: record._id, 'classification.source': 'UNCLASSIFIED', 'classification.patientReviewed': { $ne: true } },
        { $set: { classification: { ...derived, source: 'AI', confidence: s.confidence, patientReviewed: false } } }
      );
      tagged += res.modifiedCount;
    }
    if (initialized || tagged) {
      console.log(\`🏷️  Legacy records: \${initialized} initialized, \${tagged} auto-tagged\`);
    }
  }

  /** Runs after upload. Safe to call repeatedly: it only ever touches UNCLASSIFIED, unreviewed records. */`,
  ],
  ['  RECORD_CATEGORIES,\n  RecordCategory,', '  RECORD_CATEGORIES,\n  RECORD_TYPE_TO_CATEGORY,\n  RecordCategory,'],
]);

edit('src/server.ts', [[
  "  await ensureDoctorProfiles().catch((e) => console.error('⚠️ Doctor profile repair failed:', e));",
  "  await ensureDoctorProfiles().catch((e) => console.error('⚠️ Doctor profile repair failed:', e));\n  await ClassificationService.backfillLegacyRecords().catch((e) => console.error('⚠️ Record backfill failed:', e));",
], [
  "import { ensureDoctorProfiles } from './services/doctorVerification.service.js';",
  "import { ensureDoctorProfiles } from './services/doctorVerification.service.js';\nimport { ClassificationService } from './services/classification.service.js';",
]]);

edit('src/models/MedicalRecord.ts', [[
  '// Absent on legacy documents; treated as UNCLASSIFIED (patient + uploader only) by the access policy',
  '// Absent on legacy documents until the startup backfill runs. UNCLASSIFIED records are visible to the\n    // default audience of their category (see CATEGORY_DEFAULTS); "Other" documents stay with the patient.',
]]);

// ── 5. Patient badge: say who can actually see an untagged record ──
edit('client/src/pages/patient/PatientRecordsPage.tsx', [
  [
    `  if (!c || c.source === 'UNCLASSIFIED') {
    return (
      <p className="text-[10px] mt-1 font-semibold text-amber-700 flex items-center gap-1">
        <Tags className="w-3 h-3" /> {t('Needs tags · only you can open this')}
      </p>
    );
  }`,
    `  if (!c || c.source === 'UNCLASSIFIED') {
    const defaults = taxonomy?.categoryDefaults[c?.category ?? 'OTHER'] ?? [];
    return (
      <p className="text-[10px] mt-1 font-semibold text-amber-700 flex items-center gap-1">
        <Tags className="w-3 h-3" />{' '}
        {c?.sensitivityLevel !== 'HIGHLY_CONFIDENTIAL' && defaults.length
          ? t('Needs tags · visible to: {specialties}', { specialties: defaults.map(prettify).join(', ') })
          : t('Needs tags · only you can open this')}
      </p>
    );
  }`,
  ],
  ["import { prettify } from '../../components/common/TagPicker.js';", "import { prettify, useTaxonomy } from '../../components/common/TagPicker.js';"],
]);
console.log('visibility fix applied');
