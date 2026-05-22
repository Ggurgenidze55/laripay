'use client';

import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { SiteLink } from '@/components/i18n/SiteLink';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/motion/fade-in';

export function CtaSection() {
  const { t } = useLocale();
  const c = t.landing.footerCta;

  return (
    <section className="py-24">
      <FadeIn>
        <motion.div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border px-8 py-16 text-center shadow-lift"
          whileInView={{ scale: [0.98, 1] }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 via-accent-violet/10 to-transparent" />
          <div className="relative">
            <h2 className="text-2xl font-semibold sm:text-3xl">{c.title1}</h2>
            <p className="mx-auto mt-4 max-w-md text-foreground-muted">{c.subtitle}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <SiteLink
                route="onboard"
                className={cn(
                  'inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium',
                  buttonVariants.primary,
                )}
              >
                {c.startBuilding}
              </SiteLink>
              <SiteLink
                route="demo"
                className={cn(
                  'inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium',
                  buttonVariants.secondary,
                )}
              >
                {t.nav.demo}
              </SiteLink>
              <SiteLink
                route="dashboard"
                className={cn(
                  'inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium',
                  buttonVariants.secondary,
                )}
              >
                {t.nav.console}
              </SiteLink>
            </div>
          </div>
        </motion.div>
      </FadeIn>
    </section>
  );
}
