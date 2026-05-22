export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'laripay-theme';
export const THEME_COOKIE_NAME = 'laripay-theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

/** Use saved theme when set; otherwise default to dark (not system). */
export function resolveTheme(stored: Theme | null): Theme {
  if (stored) return stored;
  return 'dark';
}

export function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE_NAME}=${theme};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}
