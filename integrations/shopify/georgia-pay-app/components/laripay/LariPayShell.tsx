'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { LariPayLogo } from './Logo';
import { MobileNav } from './MobileNav';
import { SiteFooter } from './SiteFooter';
import { getSiteNav } from '@/lib/site-links';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LANDING_RE = /^\/laripay\/(en|ka)\/?$/;

export function LariPayShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const isLanding = LANDING_RE.test(pathname);
  const [scrolled, setScrolled] = useState(false);
  const nav = useMemo(() => getSiteNav(locale), [locale]);
  const homeHref = localePath(locale);

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLanding]);

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {!isLanding && (
        <>
          <div className="pointer-events-none fixed inset-0 bg-mesh-gradient opacity-80" />
          <div className="noise-overlay pointer-events-none fixed inset-0" />
        </>
      )}

      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-2xl transition-all duration-500',
          isLanding
            ? scrolled
              ? 'border-border-strong bg-canvas/95 shadow-glow-light dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)]'
              : 'border-transparent bg-transparent'
            : 'border-border-strong bg-canvas/90 backdrop-blur-xl',
        )}
      >
        <div
          className={cn(
            'relative mx-auto flex h-14 min-h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8',
            isLanding ? 'max-w-[90rem]' : 'max-w-7xl',
          )}
        >
          <Link href={homeHref} className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90">
            <LariPayLogo size={32} />
            <span className="hidden text-sm font-medium tracking-tight text-foreground/80 sm:inline">
              LariPay.ai
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {nav.map((item) => {
              const active =
                item.href === homeHref
                  ? isLanding
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'font-medium text-foreground' : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-foreground/[0.06] ring-1 ring-border"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:inline-flex" />
            <MobileNav />
            <Link
              href={localePath(locale, 'dashboard')}
              className="shrink-0 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-3 py-2 text-[11px] font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98] sm:px-4 sm:text-xs"
            >
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      <main
        className={cn(
          'relative flex-1',
          isLanding ? 'max-w-none px-0 py-0' : 'mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-14',
        )}
      >
        {children}
      </main>

      {isLanding ? null : <SiteFooter />}
    </div>
  );
}
