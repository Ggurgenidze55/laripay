import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.about;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function AboutPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.about;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
      <MarketingSection title={p.missionTitle}>
        <p>{p.mission}</p>
      </MarketingSection>
      <MarketingSection title={p.believeTitle}>
        <MarketingList items={p.believe} />
      </MarketingSection>
      <MarketingSection title={p.operateTitle}>
        <p>{p.operate}</p>
      </MarketingSection>
      <p>
        <Link href={localePath(locale, 'contact')} className="text-accent-cyan hover:underline">
          {p.contactLink}
        </Link>
      </p>
    </MarketingPage>
  );
}
