'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { getSiteNav } from '@/lib/site-links';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LANDING_RE = /^\/laripay\/(en|ka)\/?$/;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const nav = useMemo(() => getSiteNav(locale), [locale]);
  const homeHref = localePath(locale);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-border-strong bg-canvas-card px-3 py-2 text-xs font-medium text-foreground-muted"
      >
        {t.nav.menu}
      </button>
      {open ? (
        <nav
          className="absolute left-0 right-0 top-16 z-50 border-b border-border-strong bg-canvas px-6 py-4 shadow-lift backdrop-blur-xl"
          aria-label="Mobile"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-foreground-muted">{t.nav.navigation}</span>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          <ul className="space-y-1">
            {nav.map((item) => {
              const active =
                item.href === homeHref
                  ? LANDING_RE.test(pathname)
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 text-sm',
                      active ? 'bg-foreground/[0.06] text-foreground' : 'text-foreground-muted hover:text-foreground/80',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
