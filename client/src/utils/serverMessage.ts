import { tr } from '../context/LanguageContext.js';
import { SERVER_TEMPLATES } from '../i18n/serverMessages.js';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "No patient found with ID '{id}'" -> /^No patient found with ID '(.+?)'$/ with the placeholder names kept
const compiled = SERVER_TEMPLATES.map((template) => {
  const names: string[] = [];
  const source = template
    .split(/(\{\w+\})/g)
    .map((part) => {
      const m = part.match(/^\{(\w+)\}$/);
      if (m) {
        names.push(m[1]);
        return '(.+?)';
      }
      return escapeRe(part);
    })
    .join('');
  return { template, names, re: new RegExp(`^${source}$`) };
});

/** Translates an API message: exact text first, then templates with variable parts. Unknown text is returned as is. */
export function translateServerMessage(message?: string | null): string {
  if (!message) return '';
  for (const { template, names, re } of compiled) {
    const m = message.match(re);
    if (m) {
      const params: Record<string, string> = {};
      names.forEach((n, i) => (params[n] = m[i + 1]));
      return tr(template, params);
    }
  }
  return tr(message);
}
