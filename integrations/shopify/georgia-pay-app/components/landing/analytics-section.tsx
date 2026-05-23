'use client';

import { useLocale } from '@/components/i18n/LocaleProvider';
import { MetricStrip, SectionSplit } from './shared';

export function AnalyticsSection() {
  const { t } = useLocale();
  const s = t.landing.analytics;

  return (
    <SectionSplit
      id="analytics"
      index="07"
      tone="page"
      eyebrow={s.eyebrow}
      title={s.title}
      description={s.description}
    >
      <MetricStrip metrics={s.metrics} />
    </SectionSplit>
  );
}
