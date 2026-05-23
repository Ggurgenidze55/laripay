'use client';

import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { PaymentBrandId } from '@/lib/payment-brands';
import { SectionSplit } from './shared';

export function PaymentChannelsSection() {
  const { t } = useLocale();
  const c = t.landing.paymentChannels;

  return (
    <SectionSplit
      id="payment-methods"
      index="02"
      tone="page"
      eyebrow={c.eyebrow}
      title={c.title}
      description={c.description}
    >
      <p className="mb-4 text-label uppercase text-tx-secondary">{c.walletsTitle}</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {c.wallets.map((w) => (
          <div
            key={w.name}
            className="flex min-w-[180px] shrink-0 flex-col rounded-xl border border-bd-default bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
          >
            <PaymentBrandLogo brand={w.brand as PaymentBrandId} size="md" className="mb-3" />
            <span className="text-sm font-bold text-tx-primary dark:text-stone-50">{w.name}</span>
            <span className="mt-1 text-xs text-tx-muted">{w.desc}</span>
          </div>
        ))}
      </div>
      <p className="mb-10 text-xs text-tx-muted">{c.walletsNote}</p>

      <div className="space-y-6">
        {c.banks.map((bank) => (
          <div
            key={bank.name}
            className="grid gap-6 rounded-2xl border border-bd-default bg-white p-6 dark:border-stone-700 dark:bg-stone-900 md:grid-cols-[120px_1fr] md:items-start md:p-8"
          >
            <PaymentBrandLogo brand={bank.brand as PaymentBrandId} size="lg" />
            <div>
              <p className="text-label uppercase text-accent">{bank.product}</p>
              <h3 className="mt-2 text-2xl font-bold text-tx-primary dark:text-stone-50">{bank.name}</h3>
              <p className="mt-2 text-sm text-tx-body dark:text-stone-300">{bank.tagline}</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {bank.services.map((svc) => (
                  <li key={svc.title} className="border-l-2 border-accent/40 pl-4">
                    <p className="text-sm font-semibold text-tx-primary dark:text-stone-100">{svc.title}</p>
                    <p className="mt-1 text-xs text-tx-muted">{svc.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-tx-body dark:text-stone-400">{c.disclaimer}</p>
    </SectionSplit>
  );
}
