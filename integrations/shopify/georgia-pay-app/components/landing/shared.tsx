'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
        'relative border-t border-border py-32 md:py-44',
        className,
      )}
    >
      <GlowLine />
      <div className={cn('mx-auto px-6 lg:px-8', wide ? 'max-w-[90rem]' : 'max-w-7xl')}>
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
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div
      className={cn(
        'mb-20 max-w-3xl',
        align === 'center' && 'mx-auto text-center',
      )}
    >
      <Badge variant="accent" className="mb-6">
        {eyebrow}
      </Badge>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.35rem] md:leading-[1.06]"
      >
        {title}
      </motion.h2>
      {description && (
        <p className="mt-6 text-lg leading-relaxed text-foreground-muted md:text-xl">{description}</p>
      )}
    </div>
  );
}

export function AmbientOrbs() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent-blue/20 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-accent-violet/15 blur-[100px]"
        animate={{ x: [0, -30, 0], y: [0, -25, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}

export function GlowLine() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
  );
}
