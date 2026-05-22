'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function PricingSection() {
  const { t, href } = useLocale();
  const p = t.landing.pricing;

  const plans = [
    {
      name: p.commission,
      price: '1%',
      sub: p.perPayment,
      highlight: true,
      features: [p.noMonthly, p.tbcBog, p.fullApi],
    },
    {
      name: p.starter,
      price: '49 ₾',
      sub: p.perMonth,
      highlight: false,
      features: [p.zeroCommission, p.dashboardWebhooks, p.emailSupport],
    },
    {
      name: p.pro,
      price: '149 ₾',
      sub: p.perMonth,
      highlight: false,
      features: [p.highVolume, p.priorityRouting, p.dedicatedOnboarding],
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-24 border-t border-border py-36 md:py-48">
      <div className="mx-auto max-w-[90rem] px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="mb-6">
            {t.nav.pricing}
          </Badge>
          <h2 className="text-4xl font-semibold tracking-[-0.02em] md:text-5xl">{p.title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-foreground-muted">{p.subtitle}</p>
        </FadeIn>

        <Stagger className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <StaggerItem key={plan.name} className="h-full">
              <motion.div
                className="h-full"
                whileHover={{ y: plan.highlight ? -6 : -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <Card
                  glow={plan.highlight}
                  className={cn(
                    'flex h-full flex-col',
                    plan.highlight && 'ring-2 ring-accent-cyan/35 lg:-mt-2 lg:mb-2',
                  )}
                >
                  {plan.highlight && (
                    <Badge variant="accent" className="mb-4 w-fit">
                      {p.popular}
                    </Badge>
                  )}
                  <p className="text-xs uppercase tracking-widest text-foreground-muted">{plan.name}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-gradient-accent">
                    {plan.price}
                  </p>
                  <p className="text-sm text-foreground-muted">{plan.sub}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm text-foreground-muted">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center justify-center gap-2 lg:justify-start">
                        <span className="text-accent-cyan">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {!plan.highlight && i === 2 && <div className="mt-4 flex-1" />}
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-14 text-center">
          <Link
            href={href('/laripay/onboard')}
            className={cn(
              'group relative inline-flex h-12 items-center overflow-hidden rounded-xl px-8 text-sm font-medium',
              buttonVariants.primary,
            )}
          >
            <span className="relative z-10">{p.startBuilding}</span>
            <span className="absolute inset-0 shimmer-line opacity-30" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
