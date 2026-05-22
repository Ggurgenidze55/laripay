'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';

const STEPS = [
  {
    title: 'Checkout session',
    desc: 'Your app creates a session via REST. Customer redirects to bank.',
    icon: '01',
  },
  {
    title: 'TBC / BOG routing',
    desc: 'Smart provider selection. Sandbox and production environments.',
    icon: '02',
  },
  {
    title: 'Webhook delivery',
    desc: 'Signed events: payment.succeeded, refunds, session expiry.',
    icon: '03',
  },
  {
    title: 'Settlement & balance',
    desc: 'Net volume, platform fees, merchant dashboard analytics.',
    icon: '04',
  },
];

export function PaymentFlow() {
  return (
    <section className="relative py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-accent-violet/[0.03] to-transparent" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="text-center">
          <Badge variant="accent">Payment flow</Badge>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            End-to-end infrastructure
          </h2>
        </FadeIn>

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent lg:block" />
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <StaggerItem key={step.title}>
                <Card glow={i === 1} className="h-full text-center lg:text-left">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-violet/20 font-mono text-xs text-accent-cyan lg:mx-0">
                    {step.icon}
                  </div>
                  <h3 className="font-medium text-white/90">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">{step.desc}</p>
                  {i < STEPS.length - 1 && (
                    <motion.div
                      className="mt-4 hidden h-1 overflow-hidden rounded-full bg-white/5 lg:block"
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ width: '40%' }}
                      />
                    </motion.div>
                  )}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <FadeIn className="mt-16">
          <div className="glass-panel glow-border overflow-hidden rounded-3xl p-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { name: 'TBC Pay', status: 'Connected', color: 'text-accent-blue' },
                { name: 'BOG Pay', status: 'Connected', color: 'text-accent-violet' },
                { name: 'Webhooks', status: 'Healthy', color: 'text-emerald-400' },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between border-b border-white/5 pb-4 md:border-0 md:pb-0">
                  <div>
                    <p className={`font-medium ${p.color}`}>{p.name}</p>
                    <p className="mt-1 font-mono text-xs text-white/35">GEL · Georgia</p>
                  </div>
                  <Badge variant="live" pulse>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
