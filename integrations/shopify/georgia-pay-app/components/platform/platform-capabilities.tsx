'use client';

import { motion } from 'framer-motion';
import { PLATFORM_CAPABILITIES } from '@/lib/laripay-core/capabilities';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function PlatformCapabilities() {
  const { t } = useLocale();
  const p = t.pages.platform;
  const byTag = PLATFORM_CAPABILITIES.reduce(
    (acc, cap) => {
      const label = (p.tags as Record<string, string>)[cap.tag] || cap.tag;
      if (!acc[label]) acc[label] = [];
      acc[label].push(cap);
      return acc;
    },
    {} as Record<string, typeof PLATFORM_CAPABILITIES>,
  );

  return (
    <Stagger className="mt-12 space-y-10">
      {Object.entries(byTag).map(([tagLabel, caps]) => (
        <StaggerItem key={tagLabel}>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-foreground-muted">
            {tagLabel}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {caps.map((cap) => (
              <HoverLift key={cap.id}>
                <Card className="!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-accent-cyan">
                        <span className="text-foreground-muted">{cap.method}</span>{' '}
                        {cap.path}
                      </p>
                      <p className="mt-2 text-sm text-foreground-muted">
                        {(p.endpoints as Record<string, string>)[cap.id] || cap.id}
                      </p>
                    </div>
                    <Badge variant="accent" className="shrink-0 text-[10px]">
                      {cap.tag}
                    </Badge>
                  </div>
                </Card>
              </HoverLift>
            ))}
          </div>
        </StaggerItem>
      ))}
      <StaggerItem>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-foreground-muted"
        >
          {p.swaggerHint}{' '}
          <code className="text-accent-cyan">/docs</code>
          {p.onCoreHost}
        </motion.p>
      </StaggerItem>
    </Stagger>
  );
}
