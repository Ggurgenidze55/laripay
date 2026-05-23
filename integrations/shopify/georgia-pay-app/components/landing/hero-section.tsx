'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLandingPerformance } from '@/hooks/use-landing-performance';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import type { PaymentBrandId } from '@/lib/payment-brands';

const MOCK_TX = [
  { merchant: 'Bolt.ge', type: 'Card', amount: '24.50', ok: true },
  { merchant: 'Wolt', type: 'Apple Pay', amount: '12.30', ok: false },
  { merchant: 'Glovo', type: 'Card', amount: '47.80', ok: true },
];

export function HeroSection() {
  const { lite } = useLandingPerformance();
  const { t, route } = useLocale();
  const h = t.landing.hero;
  const statKeys = [h.stats.banks, h.stats.logistics, h.stats.currency] as const;
  const statValues = h.statValues;

  return (
    <section className="hero-canvas relative overflow-hidden border-b border-bd-default pt-24 dark:border-zinc-800 md:pt-32">
      <div className="mx-auto max-w-[1200px] px-6 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl"
        >
          <div className="landing-chip-accent mb-8 w-fit">
            <span className="h-2 w-2 rounded-full bg-accent-bright" />
            {h.badge}
          </div>
          <h1 className="text-hero text-tx-primary dark:text-stone-50">
            {h.title1}{' '}
            <span className="hero-highlight text-accent dark:text-indigo-400">{h.title2}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-tx-body dark:text-stone-300">{h.subtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-12 md:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-between rounded-2xl border border-bd-default bg-white p-6 dark:border-stone-700 dark:bg-stone-900 md:col-span-4 md:row-span-2 md:p-8"
          >
            <div className="flex flex-col gap-3">
              <Link href={route('onboard')} className="landing-btn-primary h-12 w-full justify-center text-base">
                {h.startBuilding} →
              </Link>
              <Link href={route('docs')} className="landing-btn-secondary h-12 w-full justify-center text-base">
                {h.exploreApi}
              </Link>
            </div>
            {h.paymentBadges?.length ? (
              <div className="mt-8 border-t border-bd-default pt-6 dark:border-stone-700">
                <p className="text-xs font-bold uppercase tracking-wider text-tx-muted">Accepted via</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {h.paymentBadges.map((badge) => (
                    <PaymentBrandLogo
                      key={badge.brand}
                      brand={badge.brand as PaymentBrandId}
                      size="sm"
                      className="h-6"
                      transparent
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="overflow-hidden rounded-2xl border border-bd-default bg-white shadow-float dark:border-stone-700 dark:bg-stone-900 md:col-span-5 md:row-span-3"
          >
            <div className="border-b border-bd-default bg-accent px-5 py-3 dark:border-stone-700">
              <p className="text-sm font-bold text-white">Live transactions</p>
            </div>
            {MOCK_TX.map((row) => (
              <div
                key={row.merchant}
                className="flex items-center justify-between border-b border-bd-default px-5 py-4 last:border-0 dark:border-stone-800"
              >
                <div>
                  <p className="font-semibold text-tx-primary dark:text-stone-100">{row.merchant}</p>
                  <p className="text-xs text-tx-muted">{row.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-tx-primary dark:text-stone-100">₾{row.amount}</p>
                  <span
                    className={
                      row.ok
                        ? 'text-[10px] font-semibold text-emerald-600'
                        : 'text-[10px] font-semibold text-amber-600'
                    }
                  >
                    {row.ok ? 'succeeded' : 'pending'}
                  </span>
                </div>
              </div>
            ))}
            <div className="bg-accent-light px-5 py-3 text-xs font-medium text-accent dark:bg-indigo-950 dark:text-indigo-300">
              ₾1.2M+ this month · ↑ 12%
            </div>
          </motion.div>

          {statKeys.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center justify-between rounded-2xl border border-bd-default bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900 md:col-span-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-tx-muted">{label}</p>
              <p className="font-mono text-2xl font-bold text-tx-primary dark:text-stone-50">{statValues[i]}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <a
        href="#infrastructure"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs font-bold uppercase tracking-widest text-tx-muted hover:text-accent"
      >
        {h.explore}
        <span className="block h-px w-8 bg-accent" />
      </a>
    </section>
  );
}
