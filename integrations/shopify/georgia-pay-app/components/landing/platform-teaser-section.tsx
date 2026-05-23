'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionShell, SectionHeader } from '@/components/landing/shared';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { HoverLift } from '@/components/motion/interactive';

export function PlatformTeaserSection() {
  const { t, route } = useLocale();
  const s = t.landing.platformTeaser;

  return (
    <SectionShell id="platform">
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {s.items.map((item, i) => (
          <HoverLift key={item.title}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="landing-card-interactive h-full rounded-2xl border border-border-strong bg-surface-inset p-6"
            >
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{item.body}</p>
            </motion.div>
          </HoverLift>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href={route('platform')}>
          <Button>{s.explorePlatform}</Button>
        </Link>
        <Link href={route('docs')}>
          <Button variant="ghost">{s.openDocs}</Button>
        </Link>
      </div>
    </SectionShell>
  );
}
