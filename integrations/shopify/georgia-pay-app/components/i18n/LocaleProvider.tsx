'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { persistLocale } from '@/lib/i18n/locale-preference';
import type { Messages } from '@/lib/i18n/messages/en';
import { localizeHref, swapLocaleInPathname } from '@/lib/i18n/routing';
import { resolveSiteHref, type ApiRouteKey, type SiteRouteKey } from '@/lib/site-routes';

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: Messages;
  href: (path: string) => string;
  /** Resolved localized path for a named site route */
  route: (key: SiteRouteKey | ApiRouteKey) => string;
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

  const route = useCallback((key: SiteRouteKey | ApiRouteKey) => resolveSiteHref(locale, key), [locale]);

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      persistLocale(next);
      router.push(swapLocaleInPathname(pathname, next));
    },
    [locale, pathname, router],
  );

  const value = useMemo(
    () => ({ locale, messages, t: messages, href, route, switchLocale }),
    [locale, messages, href, route, switchLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');

  const route = useCallback(
    (key: SiteRouteKey | ApiRouteKey) => resolveSiteHref(ctx.locale, key),
    [ctx.locale],
  );

  return { ...ctx, route };
}
