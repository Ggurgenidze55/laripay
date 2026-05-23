'use client';

import { FadeIn } from '@/components/motion/fade-in';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { PaymentBrandId } from '@/lib/payment-brands';
import { cn } from '@/lib/utils';

const BRAND_IDS = new Set<string>(['tbc', 'bog', 'google-pay', 'apple-pay']);

export function GeorgianBanksGrid() {
  const { t } = useLocale();
  const b = t.pages.integrations.allBanks;

  return (
    <FadeIn>
      <section id="banks" className="scroll-mt-28 space-y-8 border-t border-border pt-10">
        <header>
          <h2 className="text-xl font-medium text-foreground">{b.title}</h2>
          <p className="mt-3 max-w-3xl text-foreground/65">{b.intro}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {b.items.map((bank) => (
            <article
              key={bank.id}
              className={cn(
                'rounded-2xl border border-border bg-canvas-elevated/40 p-5',
                bank.status === 'live' ? 'border-accent-cyan/25' : 'border-border-strong',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                {BRAND_IDS.has(bank.brand) ? (
                  <PaymentBrandLogo brand={bank.brand as PaymentBrandId} size="sm" transparent />
                ) : (
                  <span className="text-sm font-semibold">{bank.name}</span>
                )}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                    bank.status === 'live'
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'bg-foreground/5 text-foreground-muted',
                  )}
                >
                  {bank.status}
                </span>
              </div>
              {!BRAND_IDS.has(bank.brand) ? (
                <p className="mt-2 text-sm font-medium text-foreground">{bank.name}</p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-foreground-muted">{bank.desc}</p>
            </article>
          ))}
        </div>

        <p className="text-sm text-foreground-muted">{b.disclaimer}</p>
      </section>
    </FadeIn>
  );
}
