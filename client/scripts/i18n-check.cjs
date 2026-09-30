/**
 * Translation completeness check.
 *
 *   node scripts/i18n-check.cjs            verify; exits 1 if anything is missing or inconsistent
 *   node scripts/i18n-check.cjs --list     print the keys that still need translating (JSON)
 *
 * Collects every English key the app can ask for:
 *   - literals passed to t() / tn() / tr() / tx() anywhere in client/src
 *   - server audit-message templates (src/utils/auditMessages.ts)
 *   - server error messages (new AppError('...')) and taxonomy labels (src/config/taxonomy.ts)
 * and checks that each of hi / kn / ta / te has a translation, that {placeholders} match the English,
 * and that no translation file carries keys nothing uses.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const CLIENT_SRC = path.resolve(__dirname, '..', 'src');
const SERVER_SRC = path.resolve(__dirname, '..', '..', 'src');
const LANGS = ['hi', 'kn', 'ta', 'te'];
const CALLS = new Set(['t', 'tn', 'tr', 'tx']);

// Identical in every language on purpose (brand names, sample IDs)
const KEEP = new Set(['FollowUp', 'PAT-XXXXXXXX', 'DOC-XXXXXXXX', 'PAT-XXXXXX', 'DOC-XXXXXX']);
const isSemanticKey = (k) => /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_-]+)+$/.test(k) || /^[a-z]+\.[^ ]+$/.test(k);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

// ── 1. collect keys ─────────────────────────────────────────────────────────
const callProblems = [];
const keys = new Map(); // key -> Set(source)
const add = (key, src) => {
  if (!key || !/\p{L}/u.test(key) || KEEP.has(key) || isSemanticKey(key)) return;
  (keys.get(key) || keys.set(key, new Set()).get(key)).add(src);
};

for (const file of walk(CLIENT_SRC)) {
  const rel = path.relative(CLIENT_SRC, file).replace(/\\/g, '/');
  if (rel.startsWith('i18n/translations/') || rel === 'context/LanguageContext.tsx') continue;
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && CALLS.has(n.expression.text) && n.arguments.length) {
      const a = n.arguments[0];
      if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) {
        add(a.text, rel);
        // every {placeholder} in the text must be supplied by the call (and nothing extra)
        const need = [...a.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
        const second = n.arguments[1];
        if (n.expression.text !== 'tx' && (need.length || (second && ts.isObjectLiteralExpression(second)))) {
          if (second && ts.isObjectLiteralExpression(second)) {
            const given = second.properties.map((pr) => (pr.name ? pr.name.getText() : '...')).filter((x) => x !== '...');
            const hasSpread = second.properties.some((pr) => ts.isSpreadAssignment(pr));
            const missing = need.filter((x) => !given.includes(x));
            const extra = given.filter((x) => !need.includes(x));
            if (!hasSpread && (missing.length || extra.length)) {
              const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
              callProblems.push(rel + ':' + line + ' t("' + a.text.slice(0, 50) + '") placeholders ' + JSON.stringify(need) + ' vs params ' + JSON.stringify(given));
            }
          } else if (need.length && !(second && !ts.isStringLiteral(second))) {
            const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
            callProblems.push(rel + ':' + line + ' t("' + a.text.slice(0, 50) + '") has placeholders ' + JSON.stringify(need) + ' but no params');
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}

// server audit templates: m('template', 'BADGE')
{
  const p = path.join(SERVER_SRC, 'utils', 'auditMessages.ts');
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/\bm\((['"`])((?:\\.|(?!\1)[^\\])*)\1\s*,/g)) add(m[2].replace(/\\'/g, "'"), 'server:auditMessages');
}
// server error messages: new AppError('...')  (templates with ${x} are matched by pattern on the client)
const serverMessages = [];
for (const file of walk(SERVER_SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/new AppError\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    let text = m[2].replace(/\\'/g, "'");
    if (m[1] === '`') {
      // `Cannot find ${req.method} ${req.originalUrl} on this server` -> compare by shape with SERVER_TEMPLATES
      text = text.replace(/\$\{[^}]+\}/g, '{*}');
    }
    serverMessages.push({ text, file: path.relative(SERVER_SRC, file).replace(/\\/g, '/') });
  }
}
// server taxonomy labels
{
  const src = fs.readFileSync(path.join(SERVER_SRC, 'config', 'taxonomy.ts'), 'utf8');
  for (const m of src.matchAll(/label:\s*'([^']+)'/g)) add(m[1], 'server:taxonomy');
}

// ── 2. server messages must be listed on the client ─────────────────────────
const problems = [];
{
  const listed = new Set([...keys.keys()]);
  const templateShapes = [...keys.keys()].filter((k) => /\{\w+\}/.test(k)).map((k) => k.replace(/\{\w+\}/g, '{*}'));
  for (const { text, file } of serverMessages) {
    if (text.includes('{*}')) {
      if (!templateShapes.includes(text)) problems.push(`server message pattern not in i18n/serverMessages.ts SERVER_TEMPLATES: "${text}" (${file})`);
    } else if (!listed.has(text)) {
      problems.push(`server message not in i18n/serverMessages.ts: "${text}" (${file})`);
    }
  }
}

// ── 3. load translations ────────────────────────────────────────────────────
// translation rows live in TypeScript; evaluate them with a tiny transpile
function loadRows() {
  const dir = path.join(CLIENT_SRC, 'i18n', 'translations');
  const rows = [];
  if (!fs.existsSync(dir)) return rows;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
    const js = ts.transpileModule(fs.readFileSync(path.join(dir, f), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const mod = { exports: {} };
    new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
    for (const row of mod.exports.rows || []) rows.push({ row, file: f });
  }
  return rows;
}
const rows = loadRows();
const dict = Object.fromEntries(LANGS.map((l) => [l, new Map()]));
const dupes = [];
for (const { row, file } of rows) {
  const [en, ...vals] = row;
  if (vals.length !== LANGS.length) { problems.push(`${file}: row for "${String(en).slice(0, 50)}" has ${vals.length} translations, expected ${LANGS.length}`); continue; }
  LANGS.forEach((l, i) => {
    if (dict[l].has(en)) dupes.push(`${file}: duplicate key "${en.slice(0, 60)}"`);
    dict[l].set(en, vals[i]);
  });
}
[...new Set(dupes)].forEach((d) => problems.push(d));

// ── 4. compare ──────────────────────────────────────────────────────────────
const missing = [];
for (const [key, srcs] of keys) {
  for (const l of LANGS) {
    const v = dict[l].get(key);
    if (v === undefined || v === '') { missing.push({ key, lang: l, sources: [...srcs].slice(0, 2) }); continue; }
    if (placeholders(v) !== placeholders(key)) problems.push(`[${l}] placeholders differ for "${key.slice(0, 60)}": ${placeholders(key)} vs ${placeholders(v)}`);
  }
}
const unused = [];
for (const l of LANGS) for (const key of dict[l].keys()) if (!keys.has(key)) unused.push(`[${l}] unused translation key: "${key.slice(0, 70)}"`);

if (process.argv.includes('--list')) {
  const need = {};
  for (const m of missing) (need[m.key] ||= { sources: m.sources, langs: [] }).langs.push(m.lang);
  console.log(JSON.stringify(need, null, 2));
  process.exit(0);
}

const uniqUnused = [...new Set(unused)];
console.log(`keys: ${keys.size}   translation rows: ${rows.length}`);
if (missing.length) {
  const byKey = new Set(missing.map((m) => m.key));
  console.log(`\nMissing translations: ${byKey.size} keys (${missing.length} language entries)`);
  [...byKey].slice(0, 25).forEach((k) => console.log('  - ' + k.slice(0, 90)));
  if (byKey.size > 25) console.log(`  … and ${byKey.size - 25} more (run with --list)`);
}
problems.forEach((p) => console.log('PROBLEM: ' + p));
callProblems.forEach((p) => console.log('CALL: ' + p));
uniqUnused.slice(0, 15).forEach((p) => console.log('WARN: ' + p));
if (uniqUnused.length > 15) console.log(`WARN: … and ${uniqUnused.length - 15} more unused keys`);

const failed = missing.length > 0 || problems.length > 0 || callProblems.length > 0;
console.log(failed ? '\nFAILED' : '\nAll translations complete.');
process.exit(failed ? 1 : 0);
