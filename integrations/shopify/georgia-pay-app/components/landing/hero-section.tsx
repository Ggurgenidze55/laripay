'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { MagneticLink } from '@/components/ui/magnetic-link';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { PaymentNetwork } from './payment-network';
import { ParticleField } from './particle-field';

const STAT_VALUES = [
  { v: '<50ms' },
  { v: 'TBC + BOG' },
  { v: 'GEL' },
] as const;

export function HeroSection() {
  const reduced = useReducedMotion();
  const { t, route } = useLocale();
  const h = t.landing.hero;
  const statKeys = [h.stats.latency, h.stats.providers, h.stats.currency] as const;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 24 });
  const sy = useSpring(my, { stiffness: 50, damping: 24 });
  const visualX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const visualY = useTransform(sy, [-0.5, 0.5], [8, -8]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-[0.35] dark:opacity-[0.18] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_0%,black,transparent)]" />
      {!reduced && <ParticleField />}

      <div
        className="relative mx-auto flex min-h-[100svh] max-w-[90rem] flex-col justify-center px-6 pb-36 pt-24 lg:px-8 lg:pt-32"
        onMouseMove={(e) => {
          if (reduced) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:items-center lg:gap-28">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge variant="accent" pulse className="mb-10">
                {h.badge}
              </Badge>
            </motion.div>

            <h1 className="max-w-2xl text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] min-[400px]:text-[2.35rem] sm:text-5xl lg:text-[4.5rem]">
              {[h.title1, h.title2].map((line, i) => (
                <motion.span
                  key={line}
                  initial={{ opacity: 0, y: 32, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.85, delay: 0.12 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('block', i === 0 ? 'text-gradient' : 'mt-2 text-gradient-accent')}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-10 max-w-xl text-lg leading-[1.7] text-foreground-muted md:text-xl"
            >
              {h.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="mt-14 flex flex-wrap items-center gap-4"
            >
              <MagneticLink
                href={route('onboard')}
                className={cn(
                  'group relative inline-flex h-12 items-center overflow-hidden rounded-2xl px-9 text-sm font-medium',
                  buttonVariants.primary,
                )}
              >
                <span className="relative z-10">{h.startBuilding}</span>
                {!reduced && <span className="absolute inset-0 shimmer-line opacity-40" />}
              </MagneticLink>
              <MagneticLink
                href={route('docs')}
                className={cn(
                  'inline-flex h-12 items-center rounded-2xl px-9 text-sm font-medium',
                  buttonVariants.secondary,
                )}
              >
                {h.exploreApi}
              </MagneticLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-3 border-t border-border pt-10 text-center sm:mt-24 sm:gap-8 sm:pt-14 sm:text-left"
            >
              {STAT_VALUES.map((s, i) => (
                <motion.div
                  key={statKeys[i]}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.06 }}
                  whileHover={reduced ? undefined : { y: -3 }}
                  className="rounded-xl px-2 py-1 transition-colors hover:bg-foreground/[0.03]"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-foreground-muted/80">
                    {statKeys[i]}
                  </p>
                  <p className="mt-2 font-mono text-base tracking-tight text-foreground sm:mt-2.5 sm:text-xl">
                    {s.v}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            style={reduced ? undefined : { x: visualX, y: visualY }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-16 rounded-[3rem] bg-gradient-to-br from-accent-blue/30 via-accent-violet/10 to-accent-cyan/20 blur-[80px]" />
            <div className="group relative overflow-hidden rounded-[1.5rem] border border-border-strong bg-canvas-card p-4 shadow-lift glow-border transition-shadow duration-500 sm:rounded-[2rem] sm:p-8 hover:shadow-glow-violet">
              <div className="absolute inset-x-0 top-0 h-px line-highlight" />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(34,211,238,0.08),transparent)]" />
              <PaymentNetwork />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#infrastructure"
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-foreground-muted/80 transition-colors hover:text-foreground-muted"
        animate={reduced ? undefined : { y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.35em]">{h.explore}</span>
        <span className="h-10 w-px bg-gradient-to-b from-accent-cyan/60 to-transparent" />
      </motion.a>
    </section>
  );
}
