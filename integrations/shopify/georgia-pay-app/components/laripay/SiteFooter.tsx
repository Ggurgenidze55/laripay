'use client';

import Link from 'next/link';
import { LariPayLogo } from './Logo';
import { COMPANY, getFooterColumnTitles, getFooterColumns } from '@/lib/site-links';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function FooterColumn({
  title,
  links,
  brand,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  brand?: boolean;
}) {
  return (
    <div>
      <h3
        className={cn(
          'mb-4 text-label uppercase',
          brand ? 'text-indigo-200' : 'text-tx-primary dark:text-zinc-100',
        )}
      >
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                'text-sm transition-colors duration-150',
                brand ? 'text-indigo-100/80 hover:text-white' : 'text-tx-secondary hover:text-accent',
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({
  compact = false,
  brand = false,
  navy = false,
}: {
  compact?: boolean;
  brand?: boolean;
  navy?: boolean;
}) {
  const isBrand = brand || navy;
  const { locale, t } = useLocale();
  const columns = useMemo(() => getFooterColumns(locale), [locale]);
  const titles = useMemo(() => getFooterColumnTitles(locale), [locale]);
  const homeHref = localePath(locale);

  return (
    <footer className={cn('relative', isBrand ? 'bg-brand' : 'border-t border-bd-default bg-white dark:border-zinc-800 dark:bg-zinc-900')}>
      <div className={cn('mx-auto max-w-[1160px] px-6', compact ? 'pb-10 pt-14' : 'py-14')}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href={homeHref} className="inline-flex items-center">
              <LariPayLogo variant={isBrand ? 'light' : 'default'} />
            </Link>
            <p
              className={cn(
                'mt-4 max-w-xs text-sm leading-relaxed',
                isBrand ? 'text-indigo-200/90' : 'text-tx-body dark:text-zinc-300',
              )}
            >
              {t.company.tagline}. {t.company.footerBlurb}
            </p>
            <p className={cn('mt-4 text-sm', isBrand ? 'text-indigo-200/90' : 'text-tx-secondary')}>
              <a href={`mailto:${COMPANY.email}`} className={isBrand ? 'hover:text-white' : 'hover:text-accent'}>
                {COMPANY.email}
              </a>
            </p>
          </div>
          <FooterColumn title={titles.product} links={columns.product} brand={isBrand} />
          <FooterColumn title={titles.developers} links={columns.developers} brand={isBrand} />
          <FooterColumn title={titles.company} links={columns.company} brand={isBrand} />
          <FooterColumn title={titles.legal} links={columns.legal} brand={isBrand} />
        </div>

        <div
          className={cn(
            'mt-10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between',
            isBrand ? 'border-slate-700' : 'border-bd-default dark:border-zinc-700',
          )}
        >
          <div className="flex flex-wrap items-center gap-4">
            <p className={cn('text-sm', isBrand ? 'text-indigo-300/90' : 'text-tx-muted')}>
              © {COMPANY.year} {COMPANY.name}. {t.company.rights}
            </p>
            {!isBrand && (
              <>
                <LanguageToggle />
                <ThemeToggle />
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {columns.legal.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  isBrand ? 'text-indigo-300/90 hover:text-indigo-100' : 'text-tx-muted hover:text-accent',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
