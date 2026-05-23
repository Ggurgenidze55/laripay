'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionSplit } from '@/components/landing/shared';

export function PlatformTeaserSection() {
  const { t, route } = useLocale();
  const s = t.landing.platformTeaser;

  return (
    <SectionSplit
      id="platform"
      index="04"
      tone="mint"
      eyebrow={s.eyebrow}
      title={s.title}
      description={s.description}
    >
      <ol className="relative border-l-2 border-accent/30 pl-8 dark:border-indigo-700">
        {s.items.map((item, i) => (
          <li key={item.title} className="relative pb-10 last:pb-0">
            <span className="absolute -left-[calc(1rem+5px)] top-1 flex h-3 w-3 rounded-full bg-accent ring-4 ring-accent-light dark:ring-zinc-900" />
            <span className="font-mono text-xs font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-1 text-lg font-bold text-tx-primary dark:text-zinc-50">{item.title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-tx-body dark:text-zinc-300">{item.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={route('platform')} className="landing-btn-primary">
          {s.explorePlatform}
        </Link>
        <Link href={route('docs')} className="landing-btn-secondary">
          {s.openDocs}
        </Link>
      </div>
    </SectionSplit>
  );
}
