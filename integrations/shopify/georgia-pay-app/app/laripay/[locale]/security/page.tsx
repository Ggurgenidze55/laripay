import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.security;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function SecurityPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.security;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
      <MarketingSection title={p.infraTitle}>
        <MarketingList items={[...p.infra]} />
      </MarketingSection>
      <MarketingSection title={p.appTitle}>
        <MarketingList items={[...p.app]} />
      </MarketingSection>
      <MarketingSection title={p.incidentTitle}>
        <p>{p.incident}</p>
      </MarketingSection>
      <MarketingSection title={p.complianceTitle}>
        <p>
          {p.complianceIntro}{' '}
          <Link href={localePath(locale, 'legal/compliance')} className="text-accent-cyan hover:underline">
            {p.complianceLink}
          </Link>{' '}
          {p.complianceSuffix}
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
