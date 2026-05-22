'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';

const PLANS = [
  {
    name: 'Commission',
    price: '1%',
    sub: 'Per successful payment',
    highlight: true,
    features: ['No monthly fee', 'TBC + BOG', 'Full API access'],
  },
  {
    name: 'Starter',
    price: '49 ₾',
    sub: 'Per month',
    highlight: false,
    features: ['0% commission', 'Dashboard + webhooks', 'Email support'],
  },
  {
    name: 'Pro',
    price: '149 ₾',
    sub: 'Per month',
    highlight: false,
    features: ['High volume stores', 'Priority routing', 'Dedicated onboarding'],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-white/[0.04] py-32 md:py-40 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.02em] md:text-5xl">Transparent pricing</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/45">
            Commission or subscription — you choose the model.
          </p>
        </FadeIn>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <StaggerItem key={plan.name}>
              <Card
                glow={plan.highlight}
                className={plan.highlight ? 'ring-1 ring-accent-blue/30' : ''}
              >
                {plan.highlight && (
                  <Badge variant="accent" className="mb-4">
                    Popular
                  </Badge>
                )}
                <p className="text-xs uppercase tracking-widest text-white/35">{plan.name}</p>
                <motion.p
                  className="mt-3 text-4xl font-semibold tracking-tight"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                >
                  {plan.price}
                </motion.p>
                <p className="text-sm text-white/40">{plan.sub}</p>
                <ul className="mt-6 space-y-2 text-sm text-white/50">
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
            href="/laripay/onboard"
            className={cn(
              'inline-flex h-12 items-center rounded-xl px-8 text-sm font-medium',
              buttonVariants.primary,
            )}
          >
            Start building
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
