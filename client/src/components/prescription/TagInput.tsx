import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

/** Free-text tags (comorbidities) with one-tap suggestions */
export const TagInput: React.FC<{ id: string; tags: string[]; onChange: (t: string[]) => void; suggestions: string[]; placeholder?: string }> = ({
  id,
  tags,
  onChange,
  suggestions,
  placeholder,
}) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const v = raw.trim().replace(/,$/, '');
    if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...tags, v]);
    setText('');
  };
  const unused = suggestions.filter((s) => !tags.some((x) => x.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-[var(--pr-line-strong)] bg-white px-2 py-1.5 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--pr-primary)]">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded bg-[var(--pr-primary-tint)] px-2 py-1 text-sm font-medium text-[var(--pr-primary)]">
            {t(tag)}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== tag))} className="rounded p-0.5 hover:bg-white" aria-label={t('Remove {item}', { item: t(tag) })}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none"
          placeholder={tags.length ? '' : placeholder}
          value={text}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              e.preventDefault();
              add(text);
            } else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={() => text.trim() && add(text)}
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => onChange([...tags, s])} className="rounded border border-[var(--pr-line)] px-2 py-1 text-xs text-[var(--pr-ink-2)] hover:bg-[var(--pr-hover)]">
              + {t(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
