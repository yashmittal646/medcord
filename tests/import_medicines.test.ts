import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Medicine } from '../src/models/Medicine.js';
import { importMedicines, resolveColumns, cleanRow, tidyCase, CsvRow } from '../src/scripts/import-medicines.js';
import { inferMedicineForm, extractStrength } from '../src/config/medicineForms.js';

/** Medicine import: mapping, cleaning, dedupe, batching, idempotent re-runs and partial failures */
async function run() {
  console.log('================================================================');
  console.log('📦 MEDICINE IMPORT SUITE');
  console.log('================================================================\n');
  const ok = (cond: unknown, msg: string) => {
    if (!cond) throw new Error(`Assertion failed: ${msg}`);
  };

  // ── [1] Pure helpers ────────────────────────────────────────────────
  ok(tidyCase('paracetamol 500mg tablet') === 'Paracetamol 500mg Tablet', 'lower-case name tidied');
  ok(tidyCase('LOGIDRUF KO SHAMPOO') === 'Logidruf KO Shampoo', 'all-caps name tidied, short codes kept');
  ok(tidyCase('Mintop Gain 5% Solution') === 'Mintop Gain 5% Solution', 'mixed case left alone');
  ok(tidyCase('  Dolo   650  ') === 'Dolo 650', 'whitespace collapsed');
  ok(inferMedicineForm('Strip of 10 tablets') === 'TABLET' && inferMedicineForm(undefined, 'Otrivin Nasal Spray') === 'SPRAY', 'form inferred from pack label or name');
  ok(inferMedicineForm('bottle of 60 ml Syrup') === 'SYRUP' && inferMedicineForm('kit') === 'KIT' && inferMedicineForm('??') === 'OTHER', 'more forms');
  ok(extractStrength('Paracetamol 500mg') === '500 mg' && extractStrength('Minoxidil (5% w/v)') === '5% w/v' && extractStrength('Ambroxol (30mg/5ml)') === '30 mg/5 ml', 'strength parsed from text');

  // "A-Z medicine dataset of India" style headers
  const azHeaders = ['id', 'name', 'price(₹)', 'Is_discontinued', 'manufacturer_name', 'type', 'pack_size_label', 'short_composition1', 'short_composition2'];
  const az = resolveColumns(azHeaders);
  ok(az.brandName[0] === 'name' && az.manufacturer[0] === 'manufacturer_name' && az.skip === 'Is_discontinued', 'aliases map dataset headers');
  ok(az.genericName.join(',') === 'short_composition1,short_composition2', 'both composition columns used');
  const azRow: CsvRow = {
    id: '1', name: 'Augmentin 625 Duo Tablet', 'price(₹)': '223.42', Is_discontinued: 'FALSE', manufacturer_name: 'Glaxo SmithKline Pharmaceuticals Ltd',
    type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxycillin  (500mg) ', short_composition2: ' Clavulanic Acid (125mg)',
  };
  const cleaned = cleanRow(azRow, az) as any;
  ok(cleaned.genericName === 'Amoxycillin (500mg) + Clavulanic Acid (125mg)' && cleaned.form === 'TABLET', 'compositions joined, form from pack label');
  ok(cleaned.strength === '500 mg', 'strength from composition when there is no column');
  ok((cleanRow({ ...azRow, Is_discontinued: 'TRUE' }, az) as any).skip === 'excluded', 'discontinued rows excluded');
  ok((cleanRow({ ...azRow, name: ' ' }, az) as any).skip === 'invalid', 'nameless rows invalid');
  console.log('✅ [1] Cleaning, mapping and parsing');

  // ── [2] Batching, dedupe, idempotency against a database ─────────────
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Medicine.syncIndexes();
  try {
    const rows: CsvRow[] = [];
    for (let i = 0; i < 23; i++) rows.push({ brand: `Test Medicine ${i} Tablet`, composition: `Compound ${i} (10mg)`, company: 'Acme Pharma' });
    rows.push({ brand: 'TEST MEDICINE 0 TABLET', composition: 'Compound 0 (10mg)', company: 'acme pharma' }); // duplicate after cleaning
    rows.push({ brand: '', composition: 'x', company: 'y' });

    const first = await importMedicines(rows, { batchSize: 5 });
    ok(first.read === 25 && first.inserted === 23 && first.skippedDuplicate === 1 && first.skippedInvalid === 1 && first.failed === 0, `first run ${JSON.stringify(first)}`);
    ok((await Medicine.countDocuments()) === 23, '23 medicines stored across 5 batches');
    const stored = await Medicine.findOne({ brandName: 'Test Medicine 7 Tablet' }).lean();
    ok(stored?.brandNameLower === 'test medicine 7 tablet' && stored.genericNameLower === 'compound 7 (10mg)' && stored.scope === 'global' && stored.source === 'seed', 'search fields and scope set');

    // An admin edit must survive a re-import
    await Medicine.updateOne({ _id: stored!._id }, { $set: { genericName: 'Edited by admin' } });
    const second = await importMedicines(rows, { batchSize: 5 });
    ok(second.inserted === 0 && second.alreadyPresent === 23, `re-run inserts nothing ${JSON.stringify(second)}`);
    ok((await Medicine.findById(stored!._id).lean())?.genericName === 'Edited by admin', 're-run never overwrites existing documents');
    ok((await Medicine.countDocuments()) === 23, 'no duplicates after re-run');

    // Dry run writes nothing
    const dry = await importMedicines([{ brand: 'Brand New Syrup', company: 'Acme' }], { dryRun: true });
    ok(dry.inserted === 1 && (await Medicine.countDocuments({ brandName: 'Brand New Syrup' })) === 0, 'dry run does not write');

    // A failing batch is counted, the rest still imports
    let calls = 0;
    const flaky = await importMedicines(
      Array.from({ length: 6 }, (_, i) => ({ brand: `Flaky ${i}` })),
      {
        batchSize: 3,
        write: async (batch) => {
          if (++calls === 1) throw new Error('network blip');
          return { inserted: batch.length, alreadyPresent: 0, failed: 0 };
        },
      }
    );
    ok(flaky.failed === 3 && flaky.inserted === 3, 'a failed batch is reported and the import continues');

    // Missing brand column is a clear error
    let message = '';
    try {
      await importMedicines([{ foo: 'bar' }]);
    } catch (e: any) {
      message = e.message;
    }
    ok(message.includes('No brand-name column found'), 'unknown CSV layout explains how to fix the mapping');
    console.log('✅ [2] Batches, dedupe, idempotent re-runs, dry run and partial failures');

    console.log('\n================================================================');
    console.log('🎉 MEDICINE IMPORT SUITE PASSED');
    console.log('================================================================\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

run().catch((err) => {
  console.error('❌ Medicine Import Suite Failed:', err);
  process.exit(1);
});
