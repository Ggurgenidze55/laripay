'use client';

import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SiteFooter } from '@/components/laripay/SiteFooter';
import { MagneticLink } from '@/components/ui/magnetic-link';
import { PricingSection } from './pricing-section';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FadeIn } from '@/components/motion/fade-in';

export function EnterpriseFooter() {
  const { t, route } = useLocale();
  const f = t.landing.footerCta;

  return (
    <>
      <PricingSection />

      <section className="relative overflow-hidden border-t border-border py-40 md:py-48">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent-blue/12 via-transparent to-transparent" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(500px,80vw)] w-[min(500px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet/20 blur-[140px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute left-[15%] top-[20%] h-48 w-48 rounded-full bg-accent-cyan/15 blur-[80px]"
          animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute right-[15%] top-[25%] h-48 w-48 rounded-full bg-accent-blue/15 blur-[80px]"
          animate={{ x: [0, -20, 0], y: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <FadeIn>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-gradient">{f.title1}</span>
              <br />
              <span className="text-gradient-accent">{f.title2}</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-foreground-muted">
              {f.subtitle}
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <MagneticLink
              href={route('onboard')}
              className={cn(
                'group relative inline-flex h-14 items-center overflow-hidden rounded-2xl px-10 text-sm font-medium',
                buttonVariants.primary,
              )}
            >
              <span className="relative z-10">{f.startBuilding}</span>
              <span className="absolute inset-0 shimmer-line opacity-35" />
            </MagneticLink>
            <MagneticLink
              href={route('dashboard')}
              className={cn(
                'inline-flex h-14 items-center rounded-2xl px-10 text-sm font-medium',
                buttonVariants.secondary,
              )}
            >
              {f.openConsole}
            </MagneticLink>
          </FadeIn>
        </div>
      </section>

      <SiteFooter compact />
    </>
  );
}
