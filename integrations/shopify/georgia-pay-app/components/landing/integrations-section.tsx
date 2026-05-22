'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function IntegrationsSection() {
  const { t } = useLocale();
  const s = t.landing.integrationsSection;

  return (
    <SectionShell id="integrations" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-8 md:grid-cols-3">
        {s.platforms.map((p, i) => (
          <StaggerItem key={p.name} className="h-full">
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={cn(
                'landing-card-interactive group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-3xl border border-border-strong p-8',
                'bg-gradient-to-b from-foreground/[0.04] to-transparent dark:from-white/[0.04]',
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px line-highlight opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan/80">
                {p.tag}
              </span>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground-muted">{p.desc}</p>
              <motion.div
                className="mt-8 h-1 w-12 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.6 }}
                style={{ originX: 0 }}
              />
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent-violet/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-accent-blue/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
