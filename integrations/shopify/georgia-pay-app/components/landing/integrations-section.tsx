'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function IntegrationsSection() {
  const { t } = useLocale();
  const s = t.landing.integrationsSection;

  return (
    <SectionShell id="integrations" wide>
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-8 md:grid-cols-3">
        {s.platforms.map((p) => (
          <StaggerItem key={p.name}>
            <motion.div
              whileHover={{ y: -8 }}
              className="group relative h-full overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-b from-foreground/[0.04] to-transparent p-8 dark:from-white/[0.04]"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan/80">
                {p.tag}
              </span>
              <h3 className="mt-6 text-2xl font-semibold">{p.name}</h3>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted">{p.desc}</p>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-violet/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
