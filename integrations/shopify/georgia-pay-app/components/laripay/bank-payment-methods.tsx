'use client';

import { FadeIn } from '@/components/motion/fade-in';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { PaymentBrandId } from '@/lib/payment-brands';
import { cn } from '@/lib/utils';

export function BankPaymentMethods() {
  const { t } = useLocale();
  const b = t.pages.integrations.bankPayments;

  return (
    <FadeIn>
      <section id="payment-methods" className="scroll-mt-28 space-y-10 border-t border-border pt-10">
        <div>
          <h2 className="text-xl font-medium text-foreground">{b.title}</h2>
          <p className="mt-3 max-w-3xl text-foreground/65">{b.intro}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {b.wallets.map((w) => (
            <div key={w.label} className="flex items-center gap-3 rounded-xl border border-border bg-canvas-elevated/60 px-4 py-3">
              <PaymentBrandLogo brand={w.brand as PaymentBrandId} size="sm" transparent />
              <span className="text-sm font-medium">{w.label}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {b.banks.map((bank, i) => (
            <div
              key={bank.name}
              className={cn(
                'rounded-2xl border border-border bg-canvas-elevated/40 p-6',
                i === 0 ? 'border-accent-cyan/20' : 'border-accent-violet/20',
              )}
            >
              <PaymentBrandLogo brand={bank.brand as PaymentBrandId} size="md" className="mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">{bank.product}</p>
              <h3 className="mt-2 text-lg font-semibold">{bank.name}</h3>
              <ul className="mt-4 space-y-3">
                {bank.services.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-foreground/70">
                    <span className="text-accent-cyan">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground-muted">{b.disclaimer}</p>
      </section>
    </FadeIn>
  );
}
