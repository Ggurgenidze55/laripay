import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config';
import { LOCALE_COOKIE_NAME } from '@/lib/i18n/locale-preference';
import { canonicalMarketingPath, parseMarketingPath } from '@/lib/i18n/routing';

const LARIPAY_LOCALE = /^\/laripay\/(en|ka)(\/|$)/;

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookie && isLocale(cookie)) return cookie;
  return DEFAULT_LOCALE;
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

/** Only real static files — not marketing paths like /laripay.ka */
function isStaticAsset(pathname: string): boolean {
  return /\.(?:ico|svg|png|jpe?g|gif|webp|css|js|mjs|map|woff2?|ttf|txt|xml|json)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = preferredLocale(request);

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Common typo: /laripay.ka or /laripay.en (dot instead of slash)
  const dotLocale = pathname.match(/^\/laripay\.(en|ka)\/?$/);
  if (dotLocale && isLocale(dotLocale[1])) {
    return redirect(request, `/laripay/${dotLocale[1]}`);
  }

  if (pathname === '/lanpay' || pathname === '/lanpay/') {
    return redirect(request, `/laripay/${cookieLocale}`);
  }

  if (pathname.startsWith('/lanpay/')) {
    const tail = pathname.slice('/lanpay/'.length);
    if (tail === 'en' || tail === 'ka') {
      return redirect(request, `/laripay/${tail}`);
    }
    return redirect(request, canonicalMarketingPath(`/laripay/${tail}`, cookieLocale));
  }

  if (pathname === '/lari-pay' || pathname === '/lari-pay/') {
    return redirect(request, `/laripay/${cookieLocale}`);
  }

  if (pathname.startsWith('/lari-pay/')) {
    const tail = pathname.slice('/lari-pay/'.length);
    if (tail === 'en' || tail === 'ka') {
      return redirect(request, `/laripay/${tail}`);
    }
    return redirect(request, canonicalMarketingPath(`/laripay/${tail}`, cookieLocale));
  }

  if (pathname === '/demo' || pathname.startsWith('/demo/')) {
    const tail = pathname === '/demo' ? 'demo' : pathname.slice(1);
    return redirect(request, canonicalMarketingPath(`/laripay/${tail}`, cookieLocale));
  }

  if (pathname === '/' || pathname === '/laripay' || pathname === '/laripay/') {
    return redirect(request, `/laripay/${cookieLocale}`);
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const tail = pathname === '/dashboard' ? 'dashboard' : pathname.slice(1);
    return redirect(request, canonicalMarketingPath(`/laripay/${tail}`, cookieLocale));
  }

  if (pathname.match(/^\/(en|ka)\/(?:pay|payka|laripay)(?:\/|$)/)) {
    return redirect(request, canonicalMarketingPath(pathname));
  }

  if (pathname === '/pay' || pathname === '/payka') {
    return redirect(request, `/laripay/${cookieLocale}`);
  }

  if (pathname.startsWith('/pay/') || pathname.startsWith('/payka/')) {
    return redirect(request, canonicalMarketingPath(pathname));
  }

  if (pathname === '/en' || pathname === '/ka') {
    return redirect(request, `/laripay/${pathname.slice(1)}`);
  }

  if (pathname.startsWith('/laripay/') && !LARIPAY_LOCALE.test(pathname)) {
    const rest = pathname.slice('/laripay/'.length);
    return redirect(request, `/laripay/${cookieLocale}/${rest}`);
  }

  const laripayLocale = pathname.match(/^\/laripay\/([^/]+)/);
  if (laripayLocale && !isLocale(laripayLocale[1])) {
    return redirect(request, canonicalMarketingPath(pathname, cookieLocale));
  }

  if (LARIPAY_LOCALE.test(pathname)) {
    const parsed = parseMarketingPath(pathname);
    const canonical = `/laripay/${parsed.locale}${parsed.subpath ? `/${parsed.subpath}` : ''}`;
    if (canonical !== pathname.replace(/\/+$/, '') || pathname.includes('/pay')) {
      return redirect(request, canonical);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|laripay-logo.svg).*)'],
};
