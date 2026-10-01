import { defineConfig, transformWithEsbuild, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

/**
 * One translation dictionary per language. The source tables in src/i18n/translations hold every
 * language side by side ([en, hi, kn, ta, te]); shipping them whole made every visitor download all five.
 * `import('virtual:i18n-dict/hi')` resolves to just { english: hindi } built from those tables, so a visitor
 * downloads only the language they picked (and English needs nothing: the key is the text).
 */
function i18nDictionaries(): Plugin {
  const PREFIX = 'virtual:i18n-dict/';
  const dir = path.resolve(__dirname, 'src/i18n/translations');
  const COLUMN: Record<string, number> = { hi: 1, kn: 2, ta: 3, te: 4 };
  return {
    name: 'i18n-dictionaries',
    resolveId(id) {
      return id.startsWith(PREFIX) ? '\0' + id : undefined;
    },
    async load(id) {
      if (!id.startsWith('\0' + PREFIX)) return;
      const lang = id.slice(PREFIX.length + 1);
      const col = COLUMN[lang];
      if (!col) throw new Error(`Unknown language dictionary: ${lang}`);
      const dict: Record<string, string> = {};
      for (const file of fs.readdirSync(dir).sort()) {
        if (!file.endsWith('.ts') || file === 'types.ts') continue;
        const full = path.join(dir, file);
        this.addWatchFile(full);
        const { code } = await transformWithEsbuild(fs.readFileSync(full, 'utf8'), full, { loader: 'ts', format: 'cjs' });
        const mod = { exports: {} as { rows?: string[][] } };
        vm.runInNewContext(code, { module: mod, exports: mod.exports, require: () => ({}) });
        for (const row of mod.exports.rows ?? []) if (row[col]) dict[row[0]] = row[col];
      }
      return `export default ${JSON.stringify(dict)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), i18nDictionaries()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
