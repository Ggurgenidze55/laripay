import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

const LARIPAY_LOCALE = /^\/laripay\/(en|ka)(?=\/|$)/;

/** Paths that stay locale-free (API, static assets). */
function isExternalOrApi(href: string): boolean {
  return (
    href.startsWith('/api') ||
    href.startsWith('http') ||
    href.startsWith('mailto:') ||
    href.startsWith('#')
  );
}

/** Parse any marketing path into locale + subpath (without leading slash). */
export function parseMarketingPath(pathname: string): { locale: Locale; subpath: string } {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  const laripay = path.match(/^\/laripay\/(en|ka)(?:\/(.*))?$/);
  if (laripay && isLocale(laripay[1])) {
    const parts = (laripay[2] ?? '').split('/').filter(Boolean);
    while (parts[0] === 'pay' || parts[0] === 'payka') parts.shift();
    while (parts[0] && isLocale(parts[0])) parts.shift();
    return { locale: laripay[1], subpath: parts.join('/') };
  }

  const legacyPay = path.match(/^\/(?:payka|pay)(?:\/(.*))?$/);
  if (legacyPay) {
    const parts = (legacyPay[1] ?? '').split('/').filter(Boolean);
    let loc: Locale = DEFAULT_LOCALE;
    let subParts = parts;
    if (parts[0] && isLocale(parts[0])) {
      loc = parts[0];
      subParts = parts.slice(1);
    }
    if (subParts[0] === 'pay') subParts = subParts.slice(1);
    return { locale: loc, subpath: subParts.join('/') };
  }

  const localeFirst = path.match(/^\/(en|ka)\/(?:payka|pay|laripay)(?:\/(.*))?$/);
  if (localeFirst && isLocale(localeFirst[1])) {
    let sub = localeFirst[2] ?? '';
    const parts = sub.split('/').filter(Boolean);
    if (parts[0] && isLocale(parts[0])) {
      return { locale: localeFirst[1], subpath: parts.slice(1).join('/') };
    }
    if (parts[0] === 'pay') {
      return { locale: localeFirst[1], subpath: parts.slice(1).join('/') };
    }
    return { locale: localeFirst[1], subpath: sub };
  }

  const bareLocale = path.match(/^\/(en|ka)\/?$/);
  if (bareLocale && isLocale(bareLocale[1])) {
    return { locale: bareLocale[1], subpath: '' };
  }

  return { locale: DEFAULT_LOCALE, subpath: '' };
}

export function getLocaleFromPathname(pathname: string): Locale {
  return parseMarketingPath(pathname).locale;
}

/** Path after `/laripay/{locale}` — e.g. `pricing`, `legal/privacy`, or `` for home. */
export function stripLocaleFromPathname(pathname: string): string {
  const { subpath } = parseMarketingPath(pathname);
  return subpath ? `/${subpath}` : '';
}

/** Build localized marketing path: `/laripay/en/pricing`. */
export function localePath(locale: Locale, subpath = ''): string {
  const normalized = subpath.replace(/^\//, '').replace(/^(en|ka)\//, '').replace(/^(pay|payka)\/?/, '');
  if (!normalized) return `/laripay/${locale}`;
  return `/laripay/${locale}/${normalized}`;
}

/** Canonical URL for current or target locale. */
export function canonicalMarketingPath(pathname: string, locale?: Locale): string {
  const parsed = parseMarketingPath(pathname);
  return localePath(locale ?? parsed.locale, parsed.subpath);
}

/** Prefix locale onto an existing `/laripay/...` or legacy `/demo` href. */
export function localizeHref(href: string, locale: Locale): string {
  if (isExternalOrApi(href)) return href;

  if (href === '/demo' || href.startsWith('/demo/')) {
    const tail = href === '/demo' ? '' : href.slice('/demo'.length).replace(/^\//, '');
    return localePath(locale, tail ? `demo/${tail}` : 'demo');
  }

  if (
    href === '/laripay' ||
    href === '/laripay/' ||
    href === '/pay' ||
    href === '/pay/' ||
    href === '/payka' ||
    href === '/payka/' ||
    href.startsWith('/pay/') ||
    href.startsWith('/payka/')
  ) {
    return canonicalMarketingPath(href, locale);
  }

  if (href.startsWith('/laripay/')) {
    return canonicalMarketingPath(href, locale);
  }

  if (href === '/en' || href === '/ka' || href.startsWith('/en/') || href.startsWith('/ka/')) {
    return canonicalMarketingPath(href, locale);
  }

  if (href.startsWith('/')) {
    return localePath(locale, href.slice(1));
  }

  return href;
}

/** Swap locale segment while keeping the same page path. */
export function swapLocaleInPathname(pathname: string, nextLocale: Locale): string {
  const { subpath } = parseMarketingPath(pathname);
  return localePath(nextLocale, subpath);
}
