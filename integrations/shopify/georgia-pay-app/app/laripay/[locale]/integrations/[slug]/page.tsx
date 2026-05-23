import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getIntegrationPlatform, INTEGRATION_SLUGS, isIntegrationSlug } from '@/lib/integration-pages';
import { localePath } from '@/lib/i18n/routing';
import { LOCALES } from '@/lib/i18n/config';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string; slug: string } };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => INTEGRATION_SLUGS.map((slug) => ({ locale, slug })));
}

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  if (!isIntegrationSlug(params.slug)) return { title: 'LariPay.ai' };
  const platform = getIntegrationPlatform(locale, params.slug);
  const hub = getDictionary(locale).pages.integrations;
  return {
    title: platform ? `${platform.name} — ${hub.metaTitle}` : hub.metaTitle,
    description: platform?.desc ?? hub.metaDescription,
  };
}

export default function IntegrationDetailPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  if (!isIntegrationSlug(params.slug)) notFound();

  const platform = getIntegrationPlatform(locale, params.slug);
  if (!platform) notFound();

  const hub = getDictionary(locale).pages.integrations;
  const landing = getDictionary(locale).landing.integrationsSection;
  const itemMatch: Record<string, string> = {
    shopify: 'shopify',
    woocommerce: 'woo',
    'commerce-php': 'cart',
    delivery: 'delivery',
    warehouse: 'warehouse',
    api: 'rest',
  };
  const needle = itemMatch[params.slug] ?? platform.slug;
  const item =
    hub.items.find((i) => i.name.toLowerCase().includes(needle)) ?? hub.items[0];

  return (
    <MarketingPage eyebrow={hub.eyebrow} title={platform.name} description={platform.desc}>
      <p className="text-sm text-tx-muted">{item?.status ?? 'Available'}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
        <Link href={localePath(locale, 'docs')} className="text-accent-cyan hover:underline">
          {hub.viewDocs}
        </Link>
        <Link href={localePath(locale, 'integrations')} className="text-tx-secondary hover:underline">
          ← {landing.viewAll}
        </Link>
      </div>
    </MarketingPage>
  );
}
