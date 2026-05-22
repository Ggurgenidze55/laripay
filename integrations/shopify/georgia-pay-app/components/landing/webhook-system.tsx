'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const EVENT_TYPES = [
  'checkout.session.completed',
  'payment.succeeded',
  'payment.refunded',
  'balance.updated',
];

export function WebhookSystem() {
  const { t } = useLocale();
  const s = t.landing.webhooks;
  const [active, setActive] = useState(0);

  const events = EVENT_TYPES.map((type, i) => ({ type, ms: [38, 41, 52, 29][i] }));

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % events.length), 1600);
    return () => clearInterval(timer);
  }, [events.length]);

  return (
    <SectionShell id="webhooks" wide>
      <AmbientOrbs />
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <SectionHeader align="left" eyebrow={s.eyebrow} title={s.title} description={s.description} />

        <div className="relative">
          <div className="glass-panel glow-border overflow-hidden rounded-3xl">
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
                  className={`flex items-center justify-between rounded-xl px-4 py-3 font-mono text-[11px] ${
                    i === active ? 'bg-accent-blue/10 text-accent-cyan' : 'text-foreground-muted'
                  }`}
                  animate={i === active ? { scale: [1, 1.01, 1] } : {}}
                >
                  <span>{ev.type}</span>
                  <span className={i === active ? 'text-emerald-400' : ''}>{ev.ms}ms</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <motion.div
            className="absolute -bottom-6 -right-6 glass-panel rounded-2xl px-4 py-3 font-mono text-[10px] text-foreground-muted"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            {s.signature}
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
