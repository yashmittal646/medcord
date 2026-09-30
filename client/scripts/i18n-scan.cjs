/**
 * Lists string literals that look like user-facing English and are NOT passed to t()/tn()/tr()/tx().
 *   node scripts/i18n-scan.cjs
 * Heuristic on purpose: it errs towards reporting so nothing user-visible is silently missed.
 * Exits with status 1 when anything is found, so it can gate CI.
 */
const { SRC, walk, candidates } = require('./i18n-lib.cjs');

let total = 0;
for (const file of walk(SRC)) {
  const { rel, sf, list } = candidates(file);
  if (!list.length) continue;
  console.log(`\n${rel} (${list.length})`);
  for (const { node, text } of list) {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    console.log(`  ${String(line + 1).padStart(4)}  ${text.replace(/\s+/g, ' ').slice(0, 110)}`);
    total++;
  }
}
console.log(`\nUntranslated candidates: ${total}`);
process.exit(total ? 1 : 0);
