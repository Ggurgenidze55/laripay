'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localePath } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  /** Merchant slug shown in the app bar when logged in */
  merchantSlug?: string;
  hasLiveKey?: boolean;
  onSignOut?: () => void;
  className?: string;
};

export function MerchantAppShell({
  children,
  merchantSlug,
  hasLiveKey,
  onSignOut,
  className,
}: Props) {
  const { locale, t, route } = useLocale();
  const d = t.dashboard;
  const homeHref = localePath(locale);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className={cn(
        'railway-theme fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#0b0a10] text-[#e4e4e7] selection:bg-[#8b5cf6]/40 selection:text-white',
        className,
      )}
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0b0a10]/95 px-4 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={homeHref} className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9333ea] via-[#8b5cf6] to-[#6366f1] text-sm font-bold text-white">
              ₾
            </span>
            <span className="hidden text-sm font-bold text-white sm:inline">LariPay</span>
          </Link>
          <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-[#52525b]">
              {d.controlCenter}
            </p>
            {merchantSlug ? (
              <p className="truncate text-sm font-semibold text-white">{merchantSlug}</p>
            ) : (
              <p className="truncate text-sm text-[#71717a]">{d.login.title}</p>
            )}
          </div>
          {merchantSlug && hasLiveKey !== undefined ? (
            <span
              className={cn(
                'hidden shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:inline',
                hasLiveKey
                  ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]'
                  : 'border-[#a78bfa]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]',
              )}
            >
              {hasLiveKey ? d.productionMode : d.sandboxMode}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {merchantSlug ? (
            <>
              <Link
                href={route('docs')}
                className="hidden rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:text-white sm:inline-block"
              >
                {d.openDocs}
              </Link>
              {onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:border-red-500/40 hover:text-red-300"
                >
                  {d.signOut}
                </button>
              ) : null}
            </>
          ) : (
            <Link
              href={homeHref}
              className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:text-white"
            >
              {locale === 'ka' ? 'საიტზე' : 'Back to site'}
            </Link>
          )}
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
