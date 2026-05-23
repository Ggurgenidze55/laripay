'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';

export function PricingSection() {
  const { t, route } = useLocale();
  const p = t.landing.pricing;

  const plans = [
    {
      name: p.commission,
      price: '1%',
      sub: p.perPayment,
      featured: false,
      features: [p.noMonthly, p.tbcBog, p.fullApi],
    },
    {
      name: p.starter,
      price: '49 ₾',
      sub: p.perMonth,
      featured: true,
      features: [p.zeroCommission, p.dashboardWebhooks, p.emailSupport],
    },
    {
      name: p.pro,
      price: '149 ₾',
      sub: p.perMonth,
      featured: false,
      features: [p.highVolume, p.priorityRouting, p.dedicatedOnboarding],
    },
  ];

  return (
    <section
      id="pricing"
      className="scroll-mt-28 border-t border-bd-default bg-bg-mint py-24 dark:border-stone-800 dark:bg-stone-950 md:py-32"
    >
      <div className="mx-auto max-w-[1120px] px-6">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="landing-section-label mb-3">{t.nav.pricing}</p>
          <h2 className="text-section text-tx-primary dark:text-stone-50">{p.title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-tx-body dark:text-stone-300">{p.subtitle}</p>
        </FadeIn>

        <Stagger className="mt-16 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name} className="h-full">
              <div className={cn('relative flex h-full flex-col', plan.featured && 'md:-mt-3 md:mb-3')}>
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-chip bg-accent px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-white shadow-sm">
                    {p.popular}
                  </span>
                )}
                <div
                  className={cn(
                    'landing-card flex h-full flex-col p-8',
                    plan.featured &&
                      'border-2 border-accent shadow-float ring-4 ring-accent-light dark:ring-indigo-950',
                  )}
                >
                  <p className="text-label mb-1 uppercase tracking-[0.07em] text-tx-secondary dark:text-tx-secondary">
                    {plan.name}
                  </p>
                  <p className="text-[40px] font-extrabold leading-none text-tx-primary dark:text-[#F1F5F9]">
                    {plan.price}
                    <span className="ml-1 text-sm font-normal text-tx-secondary dark:text-tx-secondary">
                      {plan.sub}
                    </span>
                  </p>
                  <hr className="my-6 border-bd-default dark:border-bd-default" />
                  <ul className="flex-1 space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 py-1 text-sm text-tx-body dark:text-tx-body">
                        <span className="mt-0.5 shrink-0 text-success">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={route('onboard')}
                    className={cn(
                      'mt-8 w-full justify-center',
                      plan.featured ? 'landing-btn-primary' : 'landing-btn-secondary',
                    )}
                  >
                    {p.startBuilding}
                  </Link>
                  <p className="mt-4 text-center text-[12px] text-tx-muted dark:text-tx-muted">
                    No setup fee · Cancel anytime
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
