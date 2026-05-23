'use client';

import Link from 'next/link';
import { FadeIn } from '@/components/motion/fade-in';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SiteLink } from '@/components/i18n/SiteLink';

export function IntegrationsGuide() {
  const { t, route } = useLocale();
  const g = t.pages.integrations.guides;

  return (
    <div className="mt-16 space-y-14">
      <FadeIn>
        <section id="api" className="scroll-mt-28 space-y-4 border-t border-border pt-10">
          <h2 className="text-xl font-medium text-foreground">{g.apiTitle}</h2>
          <p className="text-foreground/65">{g.apiIntro}</p>
          <ol className="list-decimal space-y-2 pl-5 text-foreground/65">
            {g.apiSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <SiteLink route="onboard" className="text-sm text-accent-cyan hover:underline">
              {g.getKeys}
            </SiteLink>
            <SiteLink route="docsApi" className="text-sm text-accent-cyan hover:underline">
              {g.apiReference}
            </SiteLink>
            <SiteLink route="dashboard" className="text-sm text-accent-cyan hover:underline">
              {g.runDemo}
            </SiteLink>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section id="shopify" className="scroll-mt-28 space-y-4 border-t border-border pt-10">
          <h2 className="text-xl font-medium text-foreground">{g.shopifyTitle}</h2>
          <p className="text-foreground/65">{g.shopifyIntro}</p>
          <ol className="list-decimal space-y-2 pl-5 text-foreground/65">
            {g.shopifySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-sm text-foreground-muted">
            {g.shopifyNote}{' '}
            <SiteLink route="dashboard" className="text-accent-cyan hover:underline">
              {g.console}
            </SiteLink>
          </p>
        </section>
      </FadeIn>

      <FadeIn>
        <section id="woocommerce" className="scroll-mt-28 space-y-4 border-t border-border pt-10">
          <h2 className="text-xl font-medium text-foreground">{g.wooTitle}</h2>
          <p className="text-foreground/65">{g.wooIntro}</p>
          <ol className="list-decimal space-y-2 pl-5 text-foreground/65">
            {g.wooSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="rounded-xl border border-border bg-canvas-elevated/50 px-4 py-3 font-mono text-xs text-foreground-muted">
            {g.wooPath}
          </p>
          <Link href={route('onboard')} className="inline-block text-sm text-accent-cyan hover:underline">
            {g.getKeys} →
          </Link>
        </section>
      </FadeIn>
    </div>
  );
}
