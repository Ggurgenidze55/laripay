import type { Locale } from '@/lib/i18n/config';

/** Guess reply language from the latest user message. */
export function detectMessageLocale(text: string): Locale | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const georgian = (trimmed.match(/[\u10A0-\u10FF]/g) || []).length;
  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  if (georgian > latin && georgian >= 2) return 'ka';
  if (latin >= 3) return 'en';
  return null;
}
