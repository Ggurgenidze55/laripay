'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function AnalyticsSection() {
  const { t } = useLocale();
  const s = t.landing.analytics;

  return (
    <SectionShell id="analytics" wide>
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {s.metrics.map((m) => (
          <StaggerItem key={m.label}>
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-panel glow-border rounded-2xl p-8 text-center md:text-left"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                {m.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-gradient-accent">{m.value}</p>
              <p className="mt-2 text-sm text-foreground-muted">{m.sub}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
