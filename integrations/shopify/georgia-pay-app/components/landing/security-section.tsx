'use client';

import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

export function SecuritySection() {
  const { t } = useLocale();
  const s = t.landing.securitySection;

  return (
    <SectionShell id="security" wide>
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Stagger className="grid gap-6 md:grid-cols-2">
        {s.items.map((item) => (
          <StaggerItem key={item.title}>
            <div className="rounded-2xl border border-border-strong bg-surface-inset px-8 py-7 transition-colors hover:bg-canvas-elevated">
              <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{item.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
