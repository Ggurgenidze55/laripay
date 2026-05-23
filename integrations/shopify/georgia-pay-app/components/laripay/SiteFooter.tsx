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

type FooterVariant = 'default' | 'brand' | 'railway';

function FooterColumn({
  title,
  links,
  variant,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  variant: FooterVariant;
}) {
  return (
    <div>
      <h3
        className={cn(
          'mb-4 text-[11px] font-bold uppercase tracking-[0.18em]',
          variant === 'railway' && 'text-[#a78bfa]',
          variant === 'brand' && 'text-indigo-200',
          variant === 'default' && 'text-label text-tx-primary dark:text-zinc-100',
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
                variant === 'railway' && 'text-[#71717a] hover:text-[#c4b5fd]',
                variant === 'brand' && 'text-indigo-100/80 hover:text-white',
                variant === 'default' && 'text-tx-secondary hover:text-accent',
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
  railway = false,
}: {
  compact?: boolean;
  brand?: boolean;
  navy?: boolean;
  railway?: boolean;
}) {
  const variant: FooterVariant = railway ? 'railway' : brand || navy ? 'brand' : 'default';
  const { locale, t } = useLocale();
  const columns = useMemo(() => getFooterColumns(locale), [locale]);
  const titles = useMemo(() => getFooterColumnTitles(locale), [locale]);
  const homeHref = localePath(locale);

  return (
    <footer
      className={cn(
        'relative',
        variant === 'railway' && 'border-t border-white/[0.06] bg-[#08070c]',
        variant === 'brand' && 'bg-brand',
        variant === 'default' && 'border-t border-bd-default bg-white dark:border-zinc-800 dark:bg-zinc-900',
      )}
    >
      <div className={cn('mx-auto max-w-[1160px] px-6', compact ? 'pb-10 pt-14' : 'py-14')}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href={homeHref} className="inline-flex items-center">
              <LariPayLogo variant={variant === 'default' ? 'default' : 'light'} />
            </Link>
            <p
              className={cn(
                'mt-4 max-w-xs text-sm leading-relaxed',
                variant === 'railway' && 'text-[#71717a]',
                variant === 'brand' && 'text-indigo-200/90',
                variant === 'default' && 'text-tx-body dark:text-zinc-300',
              )}
            >
              {t.company.tagline}. {t.company.footerBlurb}
            </p>
            <p
              className={cn(
                'mt-4 text-sm',
                variant === 'railway' && 'text-[#71717a]',
                variant === 'brand' && 'text-indigo-200/90',
                variant === 'default' && 'text-tx-secondary',
              )}
            >
              <a
                href={`mailto:${COMPANY.email}`}
                className={cn(
                  variant === 'railway' && 'hover:text-[#c4b5fd]',
                  variant === 'brand' && 'hover:text-white',
                  variant === 'default' && 'hover:text-accent',
                )}
              >
                {COMPANY.email}
              </a>
            </p>
          </div>
          <FooterColumn title={titles.product} links={columns.product} variant={variant} />
          <FooterColumn title={titles.developers} links={columns.developers} variant={variant} />
          <FooterColumn title={titles.company} links={columns.company} variant={variant} />
          <FooterColumn title={titles.legal} links={columns.legal} variant={variant} />
        </div>

        <div
          className={cn(
            'mt-10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between',
            variant === 'railway' && 'border-white/[0.06]',
            variant === 'brand' && 'border-slate-700',
            variant === 'default' && 'border-bd-default dark:border-zinc-700',
          )}
        >
          <div className="flex flex-wrap items-center gap-4">
            <p
              className={cn(
                'text-sm',
                variant === 'railway' && 'text-[#52525b]',
                variant === 'brand' && 'text-indigo-300/90',
                variant === 'default' && 'text-tx-muted',
              )}
            >
              © {COMPANY.year} {COMPANY.name}. {t.company.rights}
            </p>
            {variant === 'default' && (
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
                  variant === 'railway' && 'text-[#52525b] hover:text-[#c4b5fd]',
                  variant === 'brand' && 'text-indigo-300/90 hover:text-indigo-100',
                  variant === 'default' && 'text-tx-muted hover:text-accent',
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
