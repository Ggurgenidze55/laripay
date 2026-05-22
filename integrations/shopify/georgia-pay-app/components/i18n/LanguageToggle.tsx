'use client';

import { LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { useLocale } from './LocaleProvider';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, switchLocale } = useLocale();
  const other: Locale = locale === 'en' ? 'ka' : 'en';

  return (
    <button
      type="button"
      onClick={() => switchLocale(other)}
      aria-label={`Switch to ${LOCALE_LABELS[other].full}`}
      title={LOCALE_LABELS[other].switchTo}
      className={cn(
        'inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-lg border border-border-strong bg-canvas-card px-2.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-canvas-elevated hover:text-foreground',
        className,
      )}
    >
      {LOCALE_LABELS[other].short}
    </button>
  );
}
