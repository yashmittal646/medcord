/**
 * Medicine catalogue import.
 *
 *   npm run medicines:import -- --file data/medicines.csv [--dry-run] [--batch 1000]
 *
 * Reads a CSV, cleans each row, removes duplicates (brand + strength + manufacturer) and upserts into the
 * `medicines` collection in batches. Re-running is safe: existing products are left untouched ($setOnInsert),
 * so nothing an admin or doctor changed is overwritten. Never calls a website or drug API.
 *
 * ── Edit the mapping below to match your CSV ────────────────────────────────
 * Each field lists the CSV headers it may come from, in order of preference. Headers are compared after
 * lowercasing and turning spaces/punctuation into "_", so "Brand Name" matches "brand_name".
 * genericName may list several columns; all non-empty ones are joined with " + ".
 */
export const COLUMN_MAP = {
  brandName: ['brand_name', 'brand', 'name', 'medicine_name', 'product_name', 'drug_name'],
  genericName: ['generic_name', 'composition', 'salt_composition', 'short_composition1', 'short_composition2', 'salt', 'generic'],
  strength: ['strength', 'dose', 'dosage_strength'],
  form: ['form', 'dosage_form', 'type', 'pack_size_label', 'pack_form'],
  manufacturer: ['manufacturer', 'manufacturer_name', 'company', 'marketer', 'brand_owner'],
};
/** Rows to leave out, e.g. discontinued products. Set to null to import everything. */
export const SKIP_IF: { column: string; values: string[] } | null = { column: 'is_discontinued', values: ['true', 'yes', '1'] };
/** Fields whose columns should be combined (all matches joined) instead of taking the first non-empty one */
const JOINED_FIELDS = new Set(['genericName']);
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { inferMedicineForm, extractStrength, MedicineForm } from '../config/medicineForms.js';
import { medicineDedupeKey, normalizeSearchText } from '../models/Medicine.js';

export type CsvRow = Record<string, string | undefined>;

export interface CleanMedicine {
  brandName: string;
  genericName?: string;
  strength?: string;
  form: MedicineForm;
  manufacturer?: string;
  dedupeKey: string;
}

export interface ImportSummary {
  read: number;
  inserted: number;
  alreadyPresent: number;
  skippedInvalid: number;
  skippedDuplicate: number;
  skippedExcluded: number;
  failed: number;
}

export interface SkippedRow {
  line: number;
  reason: string;
  row: CsvRow;
}

const headerKey = (h: string) => h.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const squash = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

const UNIT_WORDS = new Set(['mg', 'mcg', 'ml', 'g', 'gm', 'iu', 'kg', 'l']);

/**
 * Fix all-lowercase or ALL-CAPS names: "paracetamol 500mg" -> "Paracetamol 500mg", "SCALPE PLUS" -> "Scalpe Plus".
 * Short all-caps tokens (KO, SR, XR, DS) stay upper-case, units stay lower-case; mixed-case input is kept.
 */
export function tidyCase(s: string): string {
  const v = squash(s);
  if (!v) return v;
  const lettersOnly = v.replace(/[^A-Za-z]/g, '');
  const allLower = lettersOnly === lettersOnly.toLowerCase();
  const allUpper = lettersOnly === lettersOnly.toUpperCase();
  if (!allLower && !allUpper) return v;
  return v
    .split(' ')
    .map((w) => {
      const lw = w.toLowerCase();
      if (UNIT_WORDS.has(lw) || /^\d/.test(w)) return lw;
      if (allUpper && /^[A-Z]{2,3}$/.test(w)) return w;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');
}

/** Resolve COLUMN_MAP against the actual header row once */
export function resolveColumns(headers: string[]) {
  const present = new Map(headers.map((h) => [headerKey(h), h]));
  const pick = (aliases: string[]) => aliases.map((a) => present.get(headerKey(a))).filter((h): h is string => Boolean(h));
  return {
    brandName: pick(COLUMN_MAP.brandName),
    genericName: pick(COLUMN_MAP.genericName),
    strength: pick(COLUMN_MAP.strength),
    form: pick(COLUMN_MAP.form),
    manufacturer: pick(COLUMN_MAP.manufacturer),
    skip: SKIP_IF ? present.get(headerKey(SKIP_IF.column)) : undefined,
  };
}

type Columns = ReturnType<typeof resolveColumns>;

const valueOf = (row: CsvRow, cols: string[], field: string) => {
  const vals = cols.map((c) => squash(row[c])).filter(Boolean);
  if (!vals.length) return undefined;
  return JOINED_FIELDS.has(field) ? [...new Set(vals)].join(' + ') : vals[0];
};

/** One CSV row -> a clean medicine, or the reason it was left out */
export function cleanRow(row: CsvRow, cols: Columns): CleanMedicine | { skip: 'invalid' | 'excluded'; reason: string } {
  if (cols.skip && SKIP_IF && SKIP_IF.values.includes(squash(row[cols.skip]).toLowerCase())) {
    return { skip: 'excluded', reason: `${SKIP_IF.column} = ${row[cols.skip]}` };
  }
  const brandRaw = valueOf(row, cols.brandName, 'brandName');
  if (!brandRaw) return { skip: 'invalid', reason: 'missing brand name' };
  const brandName = tidyCase(brandRaw).slice(0, 200);
  if (brandName.length < 2) return { skip: 'invalid', reason: 'brand name too short' };

  const genericRaw = valueOf(row, cols.genericName, 'genericName');
  const genericName = genericRaw ? squash(genericRaw).slice(0, 500) : undefined;
  const strength = squash(valueOf(row, cols.strength, 'strength')) || extractStrength(brandName) || (genericName ? extractStrength(genericName) : undefined);
  const form = inferMedicineForm(valueOf(row, cols.form, 'form'), brandName);
  const manufacturerRaw = valueOf(row, cols.manufacturer, 'manufacturer');
  const manufacturer = manufacturerRaw ? tidyCase(manufacturerRaw).slice(0, 200) : undefined;

  return {
    brandName,
    genericName,
    strength: strength?.slice(0, 80),
    form,
    manufacturer,
    dedupeKey: medicineDedupeKey(brandName, strength, manufacturer),
  };
}

/**
 * Core import, independent of where rows come from (used by the CLI and the tests).
 * `write` receives each batch of clean medicines and returns how many were inserted vs already present.
 */
export async function importMedicines(
  rows: AsyncIterable<CsvRow> | Iterable<CsvRow>,
  opts: {
    batchSize?: number;
    dryRun?: boolean;
    onSkip?: (s: SkippedRow) => void;
    write?: (batch: CleanMedicine[]) => Promise<{ inserted: number; alreadyPresent: number; failed: number }>;
  } = {}
): Promise<ImportSummary> {
  const batchSize = Math.max(1, opts.batchSize ?? 1000);
  const write = opts.dryRun ? undefined : opts.write ?? mongoWriter;
  const summary: ImportSummary = { read: 0, inserted: 0, alreadyPresent: 0, skippedInvalid: 0, skippedDuplicate: 0, skippedExcluded: 0, failed: 0 };
  const seen = new Set<string>();
  let cols: Columns | null = null;
  let batch: CleanMedicine[] = [];

  const flush = async () => {
    if (!batch.length) return;
    const current = batch;
    batch = [];
    if (!write) {
      summary.inserted += current.length; // dry run: everything valid "would be" inserted or matched
      return;
    }
    try {
      const r = await write(current);
      summary.inserted += r.inserted;
      summary.alreadyPresent += r.alreadyPresent;
      summary.failed += r.failed;
    } catch (e: any) {
      console.error('Batch failed:', e?.message);
      summary.failed += current.length;
    }
  };

  for await (const row of rows as AsyncIterable<CsvRow>) {
    summary.read++;
    if (!cols) {
      cols = resolveColumns(Object.keys(row));
      if (!cols.brandName.length) throw new Error(`No brand-name column found. Headers: ${Object.keys(row).join(', ')}. Edit COLUMN_MAP in src/scripts/import-medicines.ts.`);
    }
    const clean = cleanRow(row, cols);
    if ('skip' in clean) {
      if (clean.skip === 'excluded') summary.skippedExcluded++;
      else summary.skippedInvalid++;
      opts.onSkip?.({ line: summary.read + 1, reason: clean.reason, row });
      continue;
    }
    if (seen.has(clean.dedupeKey)) {
      summary.skippedDuplicate++;
      continue;
    }
    seen.add(clean.dedupeKey);
    batch.push(clean);
    if (batch.length >= batchSize) await flush();
  }
  await flush();
  return summary;
}

/** Upsert a batch: insert new products, leave existing ones exactly as they are */
export async function mongoWriter(batch: CleanMedicine[]) {
  const { Medicine } = await import('../models/Medicine.js');
  const now = new Date();
  try {
    const res = await Medicine.bulkWrite(
      batch.map((m) => ({
        updateOne: {
          filter: { dedupeKey: m.dedupeKey },
          update: {
            $setOnInsert: {
              ...m,
              brandNameLower: normalizeSearchText(m.brandName),
              genericNameLower: m.genericName ? normalizeSearchText(m.genericName) : undefined,
              source: 'seed',
              scope: 'global',
              isVerified: true,
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
          // our own createdAt/updatedAt on insert; a re-run must not touch existing documents at all
          timestamps: false,
        },
      })),
      { ordered: false }
    );
    return { inserted: res.upsertedCount, alreadyPresent: res.matchedCount, failed: 0 };
  } catch (e: any) {
    // ordered:false keeps going past bad documents; count what did and did not make it
    const failed = e?.writeErrors?.length ?? batch.length;
    console.error('Medicine batch write error:', e?.writeErrors?.[0]?.errmsg ?? e?.message);
    const r = e?.result;
    return { inserted: r?.upsertedCount ?? r?.nUpserted ?? 0, alreadyPresent: r?.matchedCount ?? r?.nMatched ?? 0, failed };
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const arg = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const file = path.resolve(arg('file') ?? 'data/medicines.csv');
  const dryRun = args.includes('--dry-run');
  const batchSize = Number(arg('batch') ?? 1000);
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}\nPut your CSV there or pass --file path/to/file.csv`);
    process.exit(1);
  }

  const skippedFile = file.replace(/\.csv$/i, '') + '.import-skipped.csv';
  const skipped: SkippedRow[] = [];

  let disconnect: (() => Promise<void>) | undefined;
  if (!dryRun) {
    const { ENV } = await import('../config/environment.js');
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(ENV.MONGODB_URI);
    const { Medicine } = await import('../models/Medicine.js');
    await Medicine.syncIndexes();
    disconnect = () => mongoose.disconnect();
  }

  const started = Date.now();
  const parser = fs.createReadStream(file).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, relax_column_count: true, trim: true }));
  const summary = await importMedicines(parser, { batchSize, dryRun, onSkip: (s) => skipped.length < 50000 && skipped.push(s) });
  await disconnect?.();

  if (skipped.length) {
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = Object.keys(skipped[0].row);
    fs.writeFileSync(
      skippedFile,
      [['line', 'reason', ...headers].map(esc).join(','), ...skipped.map((s) => [String(s.line), s.reason, ...headers.map((h) => s.row[h] ?? '')].map(esc).join(','))].join('\n')
    );
  }

  console.log(`\nMedicine import ${dryRun ? '(dry run, nothing written)' : ''}`);
  console.log(`  file              ${file}`);
  console.log(`  rows read         ${summary.read}`);
  console.log(`  inserted          ${summary.inserted}${dryRun ? ' (valid, would be inserted or matched)' : ''}`);
  console.log(`  already present   ${summary.alreadyPresent}`);
  console.log(`  skipped invalid   ${summary.skippedInvalid}`);
  console.log(`  skipped duplicate ${summary.skippedDuplicate}`);
  console.log(`  skipped excluded  ${summary.skippedExcluded}`);
  console.log(`  failed            ${summary.failed}`);
  console.log(`  time              ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (skipped.length) console.log(`  skipped rows      ${skippedFile}`);
  process.exit(summary.failed ? 2 : 0);
}

const isCli = process.argv[1] && /import-medicines\.(ts|js)$/.test(process.argv[1]);
if (isCli) {
  main().catch((e) => {
    console.error('Import failed:', e?.message ?? e);
    process.exit(1);
  });
}
