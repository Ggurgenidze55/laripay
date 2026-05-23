'use client';

import Link from 'next/link';
import { FadeIn } from '@/components/motion/fade-in';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SiteLink } from '@/components/i18n/SiteLink';

function GuideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="marketing-section-card scroll-mt-28">
      <h2 className="text-card-h text-tx-primary dark:text-zinc-50">{title}</h2>
      <div className="mt-4 space-y-3 text-tx-body dark:text-zinc-300">{children}</div>
    </section>
  );
}

export function IntegrationsGuide() {
  const { t, route } = useLocale();
  const g = t.pages.integrations.guides;

  return (
    <div className="mt-16 space-y-6">
      <FadeIn>
        <GuideSection id="api" title={g.apiTitle}>
          <p>{g.apiIntro}</p>
          <ol className="list-decimal space-y-2 pl-5">
            {g.apiSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <SiteLink route="onboard" className="text-sm font-medium text-accent hover:underline dark:text-indigo-400">
              {g.getKeys}
            </SiteLink>
            <SiteLink route="docsApi" className="text-sm font-medium text-accent hover:underline dark:text-indigo-400">
              {g.apiReference}
            </SiteLink>
            <SiteLink route="dashboard" className="text-sm font-medium text-accent hover:underline dark:text-indigo-400">
              {g.runDemo}
            </SiteLink>
          </div>
        </GuideSection>
      </FadeIn>

      <FadeIn>
        <GuideSection id="shopify" title={g.shopifyTitle}>
          <p>{g.shopifyIntro}</p>
          <ol className="list-decimal space-y-2 pl-5">
            {g.shopifySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-sm text-tx-muted">
            {g.shopifyNote}{' '}
            <SiteLink route="dashboard" className="font-medium text-accent hover:underline dark:text-indigo-400">
              {g.console}
            </SiteLink>
          </p>
        </GuideSection>
      </FadeIn>

      <FadeIn>
        <GuideSection id="woocommerce" title={g.wooTitle}>
          <p>{g.wooIntro}</p>
          <ol className="list-decimal space-y-2 pl-5">
            {g.wooSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="rounded-btn border border-bd-default bg-bg-subtle px-4 py-3 font-mono text-xs text-tx-muted dark:border-zinc-700 dark:bg-zinc-900">
            {g.wooPath}
          </p>
          <Link href={route('onboard')} className="inline-block text-sm font-medium text-accent hover:underline dark:text-indigo-400">
            {g.getKeys} →
          </Link>
        </GuideSection>
      </FadeIn>

      <FadeIn>
        <GuideSection id="platforms" title={g.platformsTitle}>
          <p>{g.platformsIntro}</p>
          <ol className="list-decimal space-y-2 pl-5">
            {g.platformsSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-sm text-tx-muted">{g.platformsNote}</p>
        </GuideSection>
      </FadeIn>
    </div>
  );
}
