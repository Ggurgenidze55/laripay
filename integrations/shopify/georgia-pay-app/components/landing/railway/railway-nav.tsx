'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { getSiteNav } from '@/lib/site-links';
import { localePath } from '@/lib/i18n/routing';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { cn } from '@/lib/utils';

export function RailwayNav() {
  const { locale, t, route } = useLocale();
  const nav = useMemo(() => getSiteNav(locale), [locale]);
  const homeHref = localePath(locale);
  const h = t.landing.hero;
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <header
        className={cn(
          'pointer-events-auto w-full max-w-[1200px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0b0a10]/92 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl',
        )}
      >
        <div className="flex h-[56px] items-center justify-between gap-4 px-5 sm:px-6">
          <Link href={homeHref} className="shrink-0">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9333ea] via-[#8b5cf6] to-[#6366f1] text-sm font-bold text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]">
                ₾
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">LariPay</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] text-[#a1a1aa] transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex [&_button]:border-white/10 [&_button]:bg-white/5 [&_button]:text-[#a1a1aa] [&_button]:hover:text-white" />
            <Link
              href={route('login')}
              className="hidden rounded-lg px-3 py-1.5 text-[13px] text-[#a1a1aa] transition-colors hover:text-white sm:inline-block"
            >
              {locale === 'ka' ? 'შესვლა' : 'Sign in'}
            </Link>
            <Link
              href={route('onboard')}
              className="hidden rounded-lg bg-white px-4 py-1.5 text-[13px] font-semibold text-[#0b0a10] transition-all hover:shadow-[0_0_24px_-4px_rgba(255,255,255,0.35)] sm:inline-flex"
            >
              {h.startBuilding}
            </Link>
            <button
              type="button"
              aria-expanded={open}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[#a1a1aa] md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-white/[0.06] px-4 py-3 md:hidden" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={route('onboard')}
              className="mt-2 block rounded-lg bg-white py-2 text-center text-sm font-semibold text-[#0b0a10]"
              onClick={() => setOpen(false)}
            >
              {h.startBuilding}
            </Link>
          </nav>
        ) : null}
      </header>
    </div>
  );
}
