export const LOCALES = ['en', 'ka'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, { short: string; full: string; switchTo: string }> = {
  en: { short: 'EN', full: 'English', switchTo: 'ქართული' },
  ka: { short: 'KA', full: 'ქართული', switchTo: 'English' },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
