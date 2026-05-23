import type { Metadata } from 'next';
import { RailwayLanding } from '@/components/landing/railway/railway-landing';
import { LOCALES } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const landing = getDictionary(locale).landing;

  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/laripay/${locale}`,
      languages: Object.fromEntries(LOCALES.map((loc) => [loc, `/laripay/${loc}`])),
    },
    openGraph: {
      title: landing.metaTitle,
      description: landing.metaDescription,
      url: `/laripay/${locale}`,
      siteName: 'LariPay.ai',
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      type: 'website',
    },
  };
}

export default function LariPayLandingPage() {
  return <RailwayLanding />;
}
