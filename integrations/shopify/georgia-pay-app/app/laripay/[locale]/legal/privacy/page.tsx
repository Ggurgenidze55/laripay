import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.privacy;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function PrivacyPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.privacy;

  return (
    <MarketingPage title={p.title} description={`${p.updated}. ${p.intro}`}>
      <MarketingSection title={p.collectTitle}>
        <p>{p.collect}</p>
      </MarketingSection>
      <MarketingSection title={p.useTitle}>
        <p>{p.use}</p>
      </MarketingSection>
      <MarketingSection title={p.sharingTitle}>
        <p>{p.sharing}</p>
      </MarketingSection>
      <MarketingSection title={p.retentionTitle}>
        <p>{p.retention}</p>
      </MarketingSection>
      <MarketingSection title={p.contactTitle}>
        <p>{p.contact}</p>
      </MarketingSection>
    </MarketingPage>
  );
}
