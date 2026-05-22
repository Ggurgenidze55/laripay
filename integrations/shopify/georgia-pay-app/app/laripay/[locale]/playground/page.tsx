import type { Metadata } from 'next';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { ApiPlayground } from '@/components/playground/api-playground';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.playground;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function PlaygroundPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.playground;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <ApiPlayground />
    </MarketingPage>
  );
}
