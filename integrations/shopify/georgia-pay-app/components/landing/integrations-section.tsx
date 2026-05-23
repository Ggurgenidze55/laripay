'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { integrationRouteKey } from '@/lib/site-routes';
import { SectionSplit } from './shared';
import { cn } from '@/lib/utils';

/** Bento spans — uneven grid, not 3 equal cards */
const BENTO_SPANS = [
  'md:col-span-7 md:row-span-2 min-h-[220px]',
  'md:col-span-5 min-h-[160px]',
  'md:col-span-4 min-h-[160px]',
  'md:col-span-4 min-h-[160px]',
  'md:col-span-4 min-h-[160px]',
  'md:col-span-8 min-h-[180px]',
];

export function IntegrationsSection() {
  const { t, route } = useLocale();
  const s = t.landing.integrationsSection;

  return (
    <SectionSplit
      id="integrations"
      index="08"
      tone="surface"
      eyebrow={s.eyebrow}
      title={s.title}
      description={s.description}
      reverse
    >
      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-12">
        {s.platforms.map((p, i) => (
          <Link
            key={p.name}
            href={route(integrationRouteKey(p.name))}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border border-bd-default p-6 transition-all hover:border-accent hover:shadow-card-hover dark:border-stone-700 dark:bg-stone-900 md:p-8',
              i === 0 ? 'bg-accent text-white md:min-h-[280px]' : 'bg-white dark:bg-stone-900',
              BENTO_SPANS[i] ?? 'md:col-span-6',
            )}
          >
            <div>
              <span
                className={cn(
                  'text-label uppercase',
                  i === 0 ? 'text-indigo-100' : 'text-accent',
                )}
              >
                {p.tag}
              </span>
              <h3
                className={cn(
                  'mt-4 text-2xl font-bold md:text-3xl',
                  i === 0 ? 'text-white' : 'text-tx-primary dark:text-stone-50',
                )}
              >
                {p.name}
              </h3>
              <p
                className={cn(
                  'mt-3 max-w-md text-sm leading-relaxed',
                  i === 0 ? 'text-indigo-50/90' : 'text-tx-body dark:text-zinc-300',
                )}
              >
                {p.desc}
              </p>
            </div>
            <span
              className={cn(
                'mt-6 text-sm font-semibold group-hover:underline',
                i === 0 ? 'text-white' : 'text-accent',
              )}
            >
              {s.learnMore} →
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-8 border-t border-bd-default pt-6 dark:border-stone-700">
        <Link href={route('integrations')} className="text-sm font-semibold text-accent hover:underline">
          {s.viewAll} →
        </Link>
      </div>
    </SectionSplit>
  );
}
