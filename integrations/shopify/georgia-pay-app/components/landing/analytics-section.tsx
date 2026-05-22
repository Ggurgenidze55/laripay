'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function AnalyticsSection() {
  const { t } = useLocale();
  const s = t.landing.analytics;

  return (
    <SectionShell id="analytics" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {s.metrics.map((m, i) => (
          <StaggerItem key={m.label} className="h-full">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="landing-card-interactive flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-border-strong bg-canvas-card p-8 text-center shadow-card md:items-center"
            >
              <span className="font-mono text-[10px] tabular-nums text-accent-cyan/70">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                {m.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-gradient-accent md:text-4xl">
                {m.value}
              </p>
              <p className="mt-2 max-w-[12rem] text-sm text-foreground-muted">{m.sub}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
