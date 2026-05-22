import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.compliance;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function CompliancePage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.legal.compliance;

  return (
    <MarketingPage title={p.title} description={p.disclaimer}>
      <MarketingSection title={p.regulatoryTitle}>
        <p>{p.regulatory}</p>
      </MarketingSection>
      <MarketingSection title={p.banksTitle}>
        <p>{p.banks}</p>
      </MarketingSection>
      <MarketingSection title={p.kycTitle}>
        <MarketingList items={[...p.kyc]} />
      </MarketingSection>
      <MarketingSection title={p.amlTitle}>
        <p>{p.aml}</p>
      </MarketingSection>
      <MarketingSection title={p.relatedTitle}>
        <p>
          <Link href={localePath(locale, 'legal/privacy')} className="text-accent-cyan hover:underline">
            {p.privacy}
          </Link>
          {' · '}
          <Link href={localePath(locale, 'legal/terms')} className="text-accent-cyan hover:underline">
            {p.terms}
          </Link>
          {' · '}
          <Link href={localePath(locale, 'security')} className="text-accent-cyan hover:underline">
            {p.security}
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
