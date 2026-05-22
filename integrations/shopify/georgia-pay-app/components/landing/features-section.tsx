'use client';

import { Card } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';

const FEATURES = [
  {
    title: 'API-first',
    desc: 'REST v1, Bearer auth, idempotent refunds, balance endpoints.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
  },
  {
    title: 'Enterprise security',
    desc: 'Signed webhooks, API key rotation, merchant isolation.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Commerce ready',
    desc: 'Shopify Payments, WooCommerce, custom checkout.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <h2 className="text-3xl font-semibold tracking-tight">Why teams choose LariPay.ai</h2>
        </FadeIn>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <Card className="h-full">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-cyan">
                  {f.icon}
                </div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{f.desc}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
