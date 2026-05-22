'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const EVENT_TYPES = [
  'checkout.session.completed',
  'payment.succeeded',
  'payment.refunded',
  'balance.updated',
];

export function WebhookSystem() {
  const reduced = useReducedMotion();
  const { t } = useLocale();
  const s = t.landing.webhooks;
  const [active, setActive] = useState(0);

  const events = EVENT_TYPES.map((type, i) => ({ type, ms: [38, 41, 52, 29][i] }));

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % events.length), 1600);
    return () => clearInterval(timer);
  }, [events.length, reduced]);

  return (
    <SectionShell id="webhooks" wide>
      <AmbientOrbs />
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          align="left"
          className="mb-0 lg:max-w-xl"
          eyebrow={s.eyebrow}
          title={s.title}
          description={s.description}
        />

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel glow-border overflow-hidden rounded-3xl shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-mono text-xs text-foreground-muted">{s.eventStream}</span>
              <Badge variant="live" pulse>
                {s.delivering}
              </Badge>
            </div>
            <ul className="divide-y divide-border p-2">
              {events.map((ev, i) => (
                <motion.li
                  key={ev.type}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActive(i);
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 font-mono text-[11px] transition-colors',
                    i === active
                      ? 'bg-accent-blue/12 text-accent-cyan ring-1 ring-accent-cyan/25'
                      : 'text-foreground-muted hover:bg-foreground/[0.03]',
                  )}
                  animate={i === active && !reduced ? { scale: [1, 1.01, 1] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  <span>{ev.type}</span>
                  <span className={cn('tabular-nums', i === active && 'text-emerald-400')}>
                    {ev.ms}ms
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="pointer-events-none absolute -bottom-5 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 glass-panel rounded-2xl px-4 py-3 text-center font-mono text-[10px] text-foreground-muted shadow-card"
            animate={reduced ? undefined : { y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            {s.signature}
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
