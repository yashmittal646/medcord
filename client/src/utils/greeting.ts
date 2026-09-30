import { tr } from '../context/LanguageContext.js';
import { tx } from '../i18n/index.js';

const GREETINGS = [tx('Good morning, {name}'), tx('Good afternoon, {name}'), tx('Good evening, {name}')];

/** "Good morning, Asha" by the visitor's local time */
export const greeting = (name: string) => {
  const h = new Date().getHours();
  return tr(GREETINGS[h < 12 ? 0 : h < 17 ? 1 : 2], { name });
};
