import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/motion/interactive';
import { PricingSection } from '@/components/landing/pricing-section';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.pricing;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function PricingPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.pricing;

  return (
    <div className="space-y-16">
      <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
        <p className="text-foreground-muted">{p.includes}</p>
      </MarketingPage>
      <PricingSection />
      <div className="mx-auto max-w-3xl">
        <MarketingSection title={p.faqTitle}>
          <FaqList items={p.faq} />
        </MarketingSection>
        <p className="mt-8 text-sm text-foreground-muted">
          {p.questions}{' '}
          <Link href={localePath(locale, 'contact')} className="text-accent-cyan hover:underline">
            {p.contactSales}
          </Link>
        </p>
      </div>
    </div>
  );
}
