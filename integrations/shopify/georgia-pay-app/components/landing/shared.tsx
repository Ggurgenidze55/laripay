'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLandingPerformance } from '@/hooks/use-landing-performance';

const EASE = [0.22, 1, 0.36, 1] as const;

export type SectionTone = 'page' | 'surface' | 'brand' | 'mint';

const toneClasses: Record<SectionTone, string> = {
  page: 'bg-bg-page dark:bg-zinc-950',
  surface: 'bg-white dark:bg-zinc-900',
  mint: 'bg-bg-mint dark:bg-zinc-900',
  brand: 'bg-brand text-white',
};

export function SectionShell({
  id,
  children,
  className,
  wide = false,
  tone = 'page',
  borderTop = true,
  bleed = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  tone?: SectionTone;
  borderTop?: boolean;
  bleed?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative scroll-mt-28',
        bleed ? 'py-0' : 'py-20 md:py-28',
        toneClasses[tone],
        borderTop && tone !== 'brand' && 'border-t border-bd-default dark:border-zinc-800',
        className,
      )}
    >
      <div className={cn('relative mx-auto w-full px-6', wide ? 'max-w-[1200px]' : 'max-w-[960px]')}>
        {children}
      </div>
    </section>
  );
}

export function SectionSplit({
  id,
  tone = 'page',
  index,
  eyebrow,
  title,
  description,
  children,
  reverse = false,
}: {
  id?: string;
  tone?: SectionTone;
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <SectionShell id={id} tone={tone} wide>
      <div
        className={cn(
          'grid gap-12 lg:grid-cols-[minmax(240px,320px)_1fr] lg:gap-16 xl:gap-24',
          reverse && 'lg:grid-cols-[1fr_minmax(240px,320px)]',
        )}
      >
        <div className={cn('lg:sticky lg:top-28 lg:self-start', reverse && 'lg:order-2')}>
          <SectionNumber value={index} />
          <p className="landing-section-label mt-4">{eyebrow}</p>
          <h2 className="text-section mt-3 text-tx-primary dark:text-stone-50">{title}</h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-tx-body dark:text-stone-300">{description}</p>
          ) : null}
        </div>
        <div className={cn(reverse && 'lg:order-1')}>{children}</div>
      </div>
    </SectionShell>
  );
}

export function SectionNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-5xl font-black leading-none tracking-tighter text-accent/25 dark:text-indigo-500/30 md:text-6xl',
        className,
      )}
      aria-hidden
    >
      {value}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
  brand = false,
  index,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
  brand?: boolean;
  index?: string;
}) {
  const { lite } = useLandingPerformance();
  const centered = align === 'center';

  const inner = (
    <>
      {index ? <SectionNumber value={index} className={centered ? 'mx-auto block text-center' : ''} /> : null}
      <p className={cn('landing-section-label mt-4', brand && 'text-indigo-300 before:bg-indigo-400')}>{eyebrow}</p>
      <h2 className={cn('text-section mt-3', brand ? 'text-white' : 'text-tx-primary dark:text-stone-50')}>
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed md:text-xl',
            brand ? 'text-slate-300/90' : 'text-tx-body dark:text-zinc-300',
            centered && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      ) : null}
    </>
  );

  return (
    <div className={cn('mb-12 md:mb-16', centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
      {lite ? (
        inner
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {inner}
        </motion.div>
      )}
    </div>
  );
}

export function MetricStrip({
  metrics,
}: {
  metrics: readonly { label: string; value: string; sub: string }[];
}) {
  return (
    <div className="flex flex-col divide-y divide-bd-default rounded-2xl border border-bd-default bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:divide-x sm:divide-y-0">
      {metrics.map((m, i) => (
        <div key={m.label} className="flex flex-1 flex-col px-6 py-8 sm:px-8">
          <span className="font-mono text-xs font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
          <p className="mt-2 text-label uppercase text-tx-muted">{m.label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-tx-primary dark:text-stone-50">{m.value}</p>
          <p className="mt-2 text-sm text-tx-body dark:text-stone-400">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function FeatureRow({
  index,
  tag,
  title,
  body,
  highlights,
  href,
  cta,
}: {
  index: string;
  tag: string;
  title: string;
  body: string;
  highlights?: readonly string[];
  href?: string;
  cta?: string;
}) {
  const className =
    'group grid gap-6 border-b border-bd-default py-10 transition-colors last:border-0 hover:bg-bg-subtle/50 dark:border-stone-800 dark:hover:bg-stone-800/30 md:grid-cols-[80px_140px_1fr_auto] md:items-start md:gap-8 md:py-12';

  const inner = (
    <>
      <span className="font-mono text-3xl font-black text-accent/30 dark:text-indigo-600">{index}</span>
      <span className="text-label uppercase text-accent">{tag}</span>
      <div>
        <h3 className="text-xl font-bold text-tx-primary dark:text-stone-50 md:text-2xl">{title}</h3>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-tx-body dark:text-stone-300">{body}</p>
        {highlights?.length ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {highlights.map((h) => (
              <li key={h} className="text-sm text-tx-secondary before:mr-1.5 before:text-success before:content-['✓']">
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {cta && href ? (
        <span className="self-center text-sm font-semibold text-accent group-hover:underline md:self-start md:pt-1">
          {cta} →
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function AmbientOrbs() {
  return null;
}

export function GlowLine() {
  return null;
}
