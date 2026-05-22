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
    <section id="pricing" className="scroll-mt-24 border-t border-border py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.02em] md:text-5xl">{p.title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-foreground-muted">{p.subtitle}</p>
        </FadeIn>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <Card glow={plan.highlight} className={plan.highlight ? 'ring-2 ring-accent-blue/40' : ''}>
                {plan.highlight && (
                  <Badge variant="accent" className="mb-4">
                    {p.popular}
                  </Badge>
                )}
                <p className="text-xs uppercase tracking-widest text-foreground-muted">{plan.name}</p>
                <motion.p
                  className="mt-3 text-4xl font-semibold tracking-tight"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                >
                  {plan.price}
                </motion.p>
                <p className="text-sm text-foreground-muted">{plan.sub}</p>
                <ul className="mt-6 space-y-2 text-sm text-foreground-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-accent-cyan">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-12 text-center">
          <Link
            href={href('/laripay/onboard')}
            className={cn(
              'inline-flex h-12 items-center rounded-xl px-8 text-sm font-medium',
              buttonVariants.primary,
            )}
          >
            {p.startBuilding}
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
