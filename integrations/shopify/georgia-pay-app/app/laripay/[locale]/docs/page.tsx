import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

const API_METHODS = ['POST', 'GET', 'POST', 'GET', 'POST', 'GET', 'POST', 'GET'] as const;

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.docs;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function DocsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.docs;

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

      <section id="api" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
        <h2 className="text-xl font-medium text-foreground">{p.apiTitle}</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-canvas-elevated/60 font-mono text-sm">
          <table className="w-full text-left">
            <tbody className="divide-y divide-border">
              {p.apiRows.map(([path, desc], i) => (
                <tr key={path} className="text-foreground/60">
                  <td className="px-4 py-3 text-accent-cyan">{API_METHODS[i] ?? 'GET'}</td>
                  <td className="px-4 py-3 text-foreground/80">{path}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
