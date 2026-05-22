import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.terms;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function TermsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.terms;

  return (
    <MarketingPage title={p.title}>
      <MarketingSection title={p.serviceTitle}>
        <p>{p.service}</p>
      </MarketingSection>
      <MarketingSection title={p.merchantTitle}>
        <p>{p.merchant}</p>
      </MarketingSection>
      <MarketingSection title={p.feesTitle}>
        <p>{p.fees}</p>
      </MarketingSection>
      <MarketingSection title={p.availabilityTitle}>
        <p>{p.availability}</p>
      </MarketingSection>
      <MarketingSection title={p.liabilityTitle}>
        <p>{p.liability}</p>
      </MarketingSection>
      <MarketingSection title={p.lawTitle}>
        <p>{p.law}</p>
      </MarketingSection>
    </MarketingPage>
  );
}
