import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './config';

export function resolveLocaleParam(locale: string): Locale {
  if (!isLocale(locale)) notFound();
  return locale;
}
