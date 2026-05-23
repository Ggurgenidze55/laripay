import type { Metadata } from 'next';
import Link from 'next/link';
import { IntegrationGrid } from '@/components/motion/interactive';
import { BankPaymentMethods } from '@/components/laripay/bank-payment-methods';
import { GeorgianBanksGrid } from '@/components/laripay/georgian-banks-grid';
import { CommerceIntegrationsPanel } from '@/components/laripay/commerce-integrations-panel';
import { IntegrationsGuide } from '@/components/laripay/integrations-guide';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { integrationRouteKey, resolveSiteHref } from '@/lib/site-routes';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.integrations;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function IntegrationsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.integrations;

  const gridItems = p.items.map((item) => ({
    ...item,
    href: resolveSiteHref(locale, integrationRouteKey(item.name)),
  }));

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <IntegrationGrid items={gridItems} viewDocs={p.viewDocs} />
      <GeorgianBanksGrid />
      <BankPaymentMethods />
      <CommerceIntegrationsPanel />
      <IntegrationsGuide />
      <MarketingSection title={p.customTitle}>
        <p>{p.customBody}</p>
        <p>
          <Link href={localePath(locale, 'contact')} className="text-accent-cyan hover:underline">
            {p.partnerships}
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
