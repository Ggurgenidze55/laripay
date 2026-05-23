import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { ApiTable } from '@/components/motion/interactive';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.docs;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function DocsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.docs;
  const apiMethods = p.apiRows.map(([path]) => path.split(' ')[0] as 'GET' | 'POST');

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <MarketingSection title={p.quickStart}>
        <MarketingList items={[...p.quickStartSteps]} />
        <p>
          <Link href={localePath(locale, 'onboard')} className="text-accent-cyan hover:underline">
            {p.getKeys}
          </Link>
        </p>
      </MarketingSection>

      <MarketingSection title={p.authTitle}>
        <p>{p.authBody}</p>
      </MarketingSection>

      <ApiTable title={p.apiTitle} rows={p.apiRows} methods={apiMethods} />

      <MarketingSection title={p.webhooksTitle}>
        <p>{p.webhooksBody}</p>
      </MarketingSection>

      <MarketingSection title={p.sdksTitle}>
        <p>
          <Link href={localePath(locale, 'integrations')} className="text-accent-cyan hover:underline">
            {p.sdksLink}
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
