import { tr, type TParams } from '../context/LanguageContext.js';

type Translate = (key: string, params?: TParams) => string;

/** "45m left", "6h 10m left", "3d 2h left", "expired", translated */
export function timeLeftText(iso: string, t: Translate = tr): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('expired');
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return t('{minutes}m left', { minutes: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t('{hours}h {minutes}m left', { hours, minutes: mins % 60 });
  return t('{days}d {hours}h left', { days: Math.floor(hours / 24), hours: hours % 24 });
}

/** "just now", "5m ago", "3h ago", "2d ago", translated */
export function timeAgoText(iso: string, t: Translate = tr): string {
  const secs = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return t('just now');
  if (secs < 3600) return t('{minutes}m ago', { minutes: Math.floor(secs / 60) });
  if (secs < 86400) return t('{hours}h ago', { hours: Math.floor(secs / 3600) });
  return t('{days}d ago', { days: Math.floor(secs / 86400) });
}
