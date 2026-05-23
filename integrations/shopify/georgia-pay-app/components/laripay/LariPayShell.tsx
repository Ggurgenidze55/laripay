'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/motion/interactive';
import { useMemo } from 'react';
import { LariPayLogo } from './Logo';
import { MobileNav } from './MobileNav';
import { SiteFooter } from './SiteFooter';
import { getSiteNav } from '@/lib/site-links';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';

const LANDING_RE = /^\/laripay\/(en|ka)\/?$/;

export function LariPayShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const nav = useMemo(() => getSiteNav(locale), [locale]);
  const homeHref = localePath(locale);
  const dashboardHref = localePath(locale, 'dashboard');

  if (LANDING_RE.test(pathname ?? '')) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-page dark:bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-bd-default bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link href={homeHref} aria-label="LariPay">
            <LariPayLogo />
          </Link>
          <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-tx-secondary hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:inline-flex" />
            <MobileNav />
            <Link href={dashboardHref} className="landing-btn-primary h-9 px-4 text-xs sm:text-sm">
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-8 lg:py-14">
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>{children}</PageTransition>
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
