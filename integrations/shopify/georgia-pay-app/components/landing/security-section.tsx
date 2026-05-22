'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function SecuritySection() {
  const { t } = useLocale();
  const s = t.landing.securitySection;

  return (
    <SectionShell id="security" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-6 md:grid-cols-2">
        {s.items.map((item, i) => (
          <StaggerItem key={item.title} className="h-full">
            <motion.div
              whileHover={{ y: -4 }}
              className="landing-card-interactive flex h-full gap-5 rounded-2xl border border-border-strong bg-surface-inset px-8 py-7"
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-semibold',
                  i % 2 === 0
                    ? 'bg-accent-blue/15 text-accent-cyan'
                    : 'bg-accent-violet/15 text-accent-violet',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{item.desc}</p>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
