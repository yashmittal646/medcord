/** Shared helpers for the i18n scan / wrap scripts. */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SRC = path.resolve(__dirname, '..', 'src');
const SKIP_FILES = new Set(['context/LanguageContext.tsx', 'main.tsx', 'vite-env.d.ts', 'types/index.ts']);
const SKIP_ATTRS = new Set(['className', 'id', 'key', 'type', 'href', 'to', 'name', 'htmlFor', 'style', 'target', 'rel',
  'value', 'role', 'autoComplete', 'inputMode', 'accept', 'src', 'viewBox', 'd', 'fill', 'stroke', 'xmlns', 'method', 'action',
  'variant', 'size', 'lang', 'data-testid', 'pattern', 'min', 'max', 'step', 'width', 'height', 'loading', 'crossOrigin', 'as']);
const TRANSLATE_CALLS = new Set(['t', 'tn', 'tr', 'tx']);
const NON_UI_CALLS = new Set(['require', 'import', 'fetch', 'useState', 'getItem', 'setItem', 'removeItem', 'navigate',
  'querySelector', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'includes', 'startsWith', 'endsWith', 'replace',
  'split', 'join', 'test', 'match', 'indexOf', 'append', 'get', 'set', 'has', 'log', 'warn', 'error', 'CustomEvent', 'Error',
  'createContext', 'getElementById', 'open', 'setRequestHeader', 'Date', 'toLocaleDateString', 'toLocaleString',
  'toLocaleTimeString', 'parseInt', 'stringify', 'parse', 'sendFile', 'from', 'assign', 'keys']);

// Proper nouns, sample data and technology names that stay as written in every language
const KEEP = new Set(['Yash Mittal', 'Arjun Mehta', 'Priya Sharma', 'Apollo Clinic', 'Apollo Clinic & Diagnostic Centre',
  'TypeScript', 'Node.js / Express', 'React & Tailwind', 'Distributed State', 'FollowUp', 'PAT-XXXXXXXX', 'DOC-XXXXXXXX',
  'PAT-XXXXXX', 'DOC-XXXXXX', 'center 30%']);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(p) && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const looksLikeUi = (s) => {
  const t = s.trim();
  if (t.length < 2 || !/\p{L}/u.test(t) || KEEP.has(t) || t.includes('FOLLOWUP HEALTHCARE PLATFORM')) return false;
  if (/^(https?:|\/|#|\.\/|\.\.\/|mailto:|tel:|data:|Bearer )/.test(t)) return false;
  if (/rgba?\(|gradient\(|#[0-9a-f]{3,8}\b|\bpx\b.*\bpx\b|translate-|-translate/.test(t)) return false;
  if (/\b(bg|text|border|px|py|pt|pb|pl|pr|mt|mb|ml|mr|rounded|flex|grid|shadow|font|gap|items|justify|space|ring|from|to|via|opacity|transition|animate|hover|focus|disabled|group|absolute|relative|fixed|sticky|z|w|h|min|max|cursor|pointer|overflow|leading|tracking|uppercase|backdrop)[-:][\w\[\]\/.%#:-]*/.test(t)) return false;
  if (/^[a-z][a-z0-9]*([-_:.\/][a-z0-9\[\]%.]+)+$/.test(t)) return false;
  if (/^[A-Z0-9_]+$/.test(t)) return false;
  if (/^[a-z]+[A-Z]\w*$/.test(t)) return false;
  if (/^[a-z0-9_.-]+$/.test(t)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(t)) return false;
  return /\s/.test(t) || /^[A-Z][a-z]+/.test(t);
};

function inTranslateCall(n) {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && TRANSLATE_CALLS.has(p.expression.text)) return true;
    if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && p.expression.expression.getText() === 'api') return true;
  }
  return false;
}

function skipContext(n) {
  const p = n.parent;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isTypeReferenceNode(p)) return true;
  if (ts.isJsxAttribute(p) && SKIP_ATTRS.has(p.name.getText())) {
    const tag = p.parent && p.parent.parent && p.parent.parent.tagName ? p.parent.parent.tagName.getText() : '';
    const displayedValue = ['value', 'label', 'title'].includes(p.name.getText()) && /^[A-Z]/.test(tag);
    if (!displayedValue) return true;
  }
  if (ts.isPropertyAssignment(p) && p.name === n) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === n) return true;
  if (ts.isBinaryExpression(p) && ['===', '!==', '==', '!='].includes(p.operatorToken.getText())) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isPropertyAssignment(p) && /^(className|color|bg|border|icon|to|href|path|id|key|type|status|route|variant|value|gradient|accent|ring|iconBg|dot|badge|bar|glow|shadow|text|from|via)$/i.test(p.name.getText()) && !/^(label|title|description|text)$/i.test(p.name.getText())) return true;
  if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && NON_UI_CALLS.has(p.expression.text)) return true;
  if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && NON_UI_CALLS.has(p.expression.name.text)) return true;
  if (ts.isNewExpression(p)) return true;
  // console.* and localStorage keys
  if (ts.isCallExpression(p) && p.expression.getText().startsWith('console.')) return true;
  return false;
}

function textOf(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) return n.head.text + n.templateSpans.map((s) => '${…}' + s.literal.text).join('');
  return null;
}

function candidates(file) {
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  if (SKIP_FILES.has(rel) || rel.startsWith('i18n/')) return { rel, sf: null, list: [] };
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const list = [];
  (function visit(n) {
    const text = textOf(n);
    if (text !== null && !inTranslateCall(n) && !skipContext(n) && looksLikeUi(text)) list.push({ node: n, text });
    ts.forEachChild(n, visit);
  })(sf);
  return { rel, sf, src, list };
}

module.exports = { SRC, walk, candidates, looksLikeUi, TRANSLATE_CALLS, ts, fs, path };
