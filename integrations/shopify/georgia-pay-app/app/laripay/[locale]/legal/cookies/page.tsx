import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.cookies;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function CookiesPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.cookies;

  return (
    <MarketingPage title={p.title} description={p.intro}>
      <MarketingSection title={p.essentialTitle}>
        <p>{p.essential}</p>
      </MarketingSection>
      <MarketingSection title={p.analyticsTitle}>
        <p>{p.analytics}</p>
      </MarketingSection>
      <MarketingSection title={p.manageTitle}>
        <p>{p.manage}</p>
      </MarketingSection>
    </MarketingPage>
  );
}
