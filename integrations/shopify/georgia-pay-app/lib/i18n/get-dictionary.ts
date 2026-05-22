import type { Locale } from './config';
import { en } from './messages/en';
import { ka } from './messages/ka';
import type { Messages } from './messages/en';

const dictionaries: Record<Locale, Messages> = { en, ka };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale];
}
