'use client';

import Link from 'next/link';
import { SiteFooter } from '@/components/laripay/SiteFooter';
import { PricingSection } from './pricing-section';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FadeIn } from '@/components/motion/fade-in';

export function EnterpriseFooter() {
  const { t, route } = useLocale();
  const f = t.landing.footerCta;

  return (
    <>
      <PricingSection />

      <section className="relative overflow-hidden bg-brand py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-[1160px] px-6 text-center">
          <FadeIn>
            <h2 className="text-section text-white">
              {f.title1}
              <br />
              <span className="text-indigo-300">{f.title2}</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300/90">{f.subtitle}</p>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={route('onboard')}
              className="inline-flex h-12 items-center rounded-btn bg-white px-8 text-base font-semibold text-brand shadow-lg transition-transform hover:scale-[1.02]"
            >
              {f.startBuilding}
            </Link>
            <Link
              href={route('dashboard')}
              className="inline-flex h-12 items-center rounded-btn border-2 border-indigo-400/50 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              {f.openConsole}
            </Link>
          </FadeIn>
        </div>
      </section>

      <SiteFooter compact brand />
    </>
  );
}
