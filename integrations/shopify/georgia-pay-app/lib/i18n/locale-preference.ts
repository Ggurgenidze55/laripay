import { isLocale, type Locale } from './config';

export const LOCALE_STORAGE_KEY = 'laripay-locale';
export const LOCALE_COOKIE_NAME = 'laripay-locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Persist locale for client refresh and middleware redirects. */
export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(LOCALE_STORAGE_KEY);
  return v && isLocale(v) ? v : null;
}
