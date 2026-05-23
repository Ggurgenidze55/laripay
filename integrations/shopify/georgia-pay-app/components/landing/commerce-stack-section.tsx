'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { SiteRouteKey } from '@/lib/site-routes';
import { FeatureRow, SectionSplit } from './shared';

export function CommerceStackSection() {
  const { t, route } = useLocale();
  const s = t.landing.commerceStack;

  return (
    <SectionSplit
      id="commerce-stack"
      index="03"
      tone="surface"
      eyebrow={s.eyebrow}
      title={s.title}
      description={s.description}
    >
      <div className="rounded-2xl border border-bd-default bg-white dark:border-stone-700 dark:bg-stone-900">
        {s.pillars.map((pillar, i) => (
          <FeatureRow
            key={pillar.title}
            index={`0${i + 1}`}
            tag={pillar.tag}
            title={pillar.title}
            body={pillar.body}
            highlights={pillar.highlights}
            href={route(pillar.route as SiteRouteKey)}
            cta={pillar.cta}
          />
        ))}
      </div>
    </SectionSplit>
  );
}
