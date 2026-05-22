'use client';

import { motion } from 'framer-motion';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

const METRICS = [
  { label: 'Gross volume', value: '₾1.2M+', sub: 'processed monthly' },
  { label: 'API uptime', value: '99.99%', sub: 'enterprise SLA' },
  { label: 'Webhook p99', value: '118ms', sub: 'delivery latency' },
  { label: 'Merchants', value: '500+', sub: 'and growing' },
];

export function AnalyticsSection() {
  return (
    <SectionShell id="analytics" wide>
      <SectionHeader
        eyebrow="Realtime analytics"
        title="See your business breathe"
        description="Counters, charts, and feeds update as money moves — built for operators who need clarity under load."
      />

      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <StaggerItem key={m.label}>
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-panel glow-border rounded-2xl p-8 text-center md:text-left"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
                {m.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-gradient-accent">
                {m.value}
              </p>
              <p className="mt-2 text-sm text-white/40">{m.sub}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
