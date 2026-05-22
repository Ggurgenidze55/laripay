'use client';

import Link from 'next/link';
import { LariPayLogo } from './Logo';
import { COMPANY, getFooterColumnTitles, getFooterColumns } from '@/lib/site-links';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';
import { useMemo } from 'react';

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-muted">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground/85"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useLocale();
  const columns = useMemo(() => getFooterColumns(locale), [locale]);
  const titles = useMemo(() => getFooterColumnTitles(locale), [locale]);
  const homeHref = localePath(locale);

  return (
    <footer className="relative border-t border-border-strong bg-canvas-elevated">
      <div className={compact ? 'mx-auto max-w-[90rem] px-6 py-12 lg:px-8' : 'mx-auto max-w-7xl px-6 py-14 lg:px-8'}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href={homeHref} className="inline-flex items-center gap-3">
              <LariPayLogo size={36} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              {t.company.tagline}. {t.company.footerBlurb}
            </p>
            <p className="mt-4 text-sm text-foreground-muted">
              <a href={`mailto:${COMPANY.email}`} className="hover:text-accent-cyan">
                {COMPANY.email}
              </a>
            </p>
          </div>
          <FooterColumn title={titles.product} links={columns.product} />
          <FooterColumn title={titles.developers} links={columns.developers} />
          <FooterColumn title={titles.company} links={columns.company} />
          <FooterColumn title={titles.legal} links={columns.legal} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-foreground-muted/80">
              © {COMPANY.year} {COMPANY.name}. {t.company.rights}
            </p>
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <p className="text-xs text-foreground-muted/70">{t.company.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
