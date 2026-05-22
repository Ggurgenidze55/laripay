'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const EVENTS = [
  { type: 'checkout.session.completed', ms: 38 },
  { type: 'payment.succeeded', ms: 41 },
  { type: 'payment.refunded', ms: 52 },
  { type: 'balance.updated', ms: 29 },
];

export function WebhookSystem() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % EVENTS.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <SectionShell id="webhooks" wide>
      <AmbientOrbs />
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <SectionHeader
          align="left"
          eyebrow="Event system"
          title="Webhooks you can trust at scale"
          description="HMAC-signed payloads, retries with backoff, delivery logs, and idempotent handlers — Stripe-grade reliability for Georgian rails."
        />

        <div className="relative">
          <div className="glass-panel glow-border overflow-hidden rounded-3xl">
            <div className="border-b border-white/[0.06] px-5 py-4 flex justify-between items-center">
              <span className="font-mono text-xs text-white/40">event stream</span>
              <Badge variant="live" pulse>
                delivering
              </Badge>
            </div>
            <ul className="divide-y divide-white/[0.04] p-2">
              {EVENTS.map((ev, i) => (
                <motion.li
                  key={ev.type}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 font-mono text-[11px] ${
                    i === active ? 'bg-accent-blue/10 text-accent-cyan' : 'text-white/40'
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
            className="absolute -bottom-6 -right-6 glass-panel rounded-2xl px-4 py-3 font-mono text-[10px] text-white/50"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            LariPay-Signature: t=…,v1=…
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
