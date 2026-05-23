'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLandingPerformance } from '@/hooks/use-landing-performance';

const EASE = [0.22, 1, 0.36, 1] as const;

export function SectionShell({
  id,
  children,
  className,
  wide = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative scroll-mt-24 border-t border-border py-24 md:py-48',
        className,
      )}
    >
      <GlowLine />
      <div
        className={cn(
          'relative mx-auto w-full px-6 lg:px-8',
          wide ? 'max-w-[90rem]' : 'max-w-7xl',
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  const { lite } = useLandingPerformance();
  const centered = align === 'center';
  const badgeWrapClass = cn(centered && 'flex justify-center');

  return (
    <div
      className={cn(
        'mb-16 md:mb-20',
        centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl',
        className,
      )}
    >
      {lite ? (
        <div className={badgeWrapClass}>
          <Badge variant="accent" className="mb-6">
            {eyebrow}
          </Badge>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className={badgeWrapClass}
        >
          <Badge variant="accent" className="mb-6">
            {eyebrow}
          </Badge>
        </motion.div>
      )}
      {lite ? (
        <h2 className="text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.35rem] md:leading-[1.06]">
          {title}
        </h2>
      ) : (
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.35rem] md:leading-[1.06]"
        >
          {title}
        </motion.h2>
      )}
      {description &&
        (lite ? (
          <p
            className={cn(
              'mt-6 text-lg leading-relaxed text-foreground-muted md:text-xl',
              centered && 'mx-auto',
            )}
          >
            {description}
          </p>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className={cn(
              'mt-6 text-lg leading-relaxed text-foreground-muted md:text-xl',
              centered && 'mx-auto',
            )}
          >
            {description}
          </motion.p>
        ))}
    </div>
  );
}

export function AmbientOrbs() {
  const { lite } = useLandingPerformance();

  if (lite) {
    return (
      <>
        <div className="pointer-events-none absolute -left-40 top-16 h-[18rem] w-[18rem] rounded-full bg-accent-blue/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-1/4 h-[16rem] w-[16rem] rounded-full bg-accent-violet/10 blur-3xl" />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="pointer-events-none absolute -left-40 top-16 h-[22rem] w-[22rem] rounded-full bg-accent-blue/18 blur-[120px]"
        animate={{ x: [0, 36, 0], y: [0, 18, 0], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-40 top-1/4 h-[20rem] w-[20rem] rounded-full bg-accent-violet/14 blur-[110px]"
        animate={{ x: [0, -32, 0], y: [0, -20, 0], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/8 blur-[90px]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}

export function GlowLine() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-cyan/50 to-transparent" />
  );
}
