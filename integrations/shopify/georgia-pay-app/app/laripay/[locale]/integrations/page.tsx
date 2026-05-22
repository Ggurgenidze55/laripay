import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.integrations;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function IntegrationsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.integrations;
  const docsHref = localePath(locale, 'docs');

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {p.items.map((item) => (
          <Card key={item.name} className="p-6">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground-muted">
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">{item.desc}</p>
            <Link href={docsHref} className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
              {p.viewDocs}
            </Link>
          </Card>
        ))}
      </div>
      <MarketingSection title={p.customTitle}>
        <p>{p.customBody}</p>
        <p>
          <Link href={localePath(locale, 'contact')} className="text-accent-cyan hover:underline">
            {p.partnerships}
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
