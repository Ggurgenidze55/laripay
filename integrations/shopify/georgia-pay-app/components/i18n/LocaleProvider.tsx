'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { persistLocale } from '@/lib/i18n/locale-preference';
import type { Messages } from '@/lib/i18n/messages/en';
import { localizeHref, swapLocaleInPathname } from '@/lib/i18n/routing';

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: Messages;
  href: (path: string) => string;
  switchLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const messages = useMemo(() => getDictionary(locale), [locale]);

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale === 'ka' ? 'ka' : 'en';
  }, [locale]);

  const href = useCallback((path: string) => localizeHref(path, locale), [locale]);

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      persistLocale(next);
      router.push(swapLocaleInPathname(pathname, next));
    },
    [locale, pathname, router],
  );

  const value = useMemo(
    () => ({ locale, messages, t: messages, href, switchLocale }),
    [locale, messages, href, switchLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
