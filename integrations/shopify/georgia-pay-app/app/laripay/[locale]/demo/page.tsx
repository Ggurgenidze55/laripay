import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.demo;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function DemoPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.demo;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <MarketingSection title={p.stepsTitle}>
        <ol className="list-decimal space-y-3 pl-5 text-foreground/70">
          {p.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </MarketingSection>
      <MarketingSection title={p.tryTitle}>
        <p className="text-foreground/70">{p.tryBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={localePath(locale, 'onboard')}>
            <Button size="sm">{p.getKeys}</Button>
          </Link>
          <Link href={localePath(locale, 'dashboard')}>
            <Button variant="ghost" size="sm">
              {p.openConsole}
            </Button>
          </Link>
          <Link href={localePath(locale, 'docs')}>
            <Button variant="ghost" size="sm">
              {p.openDocs}
            </Button>
          </Link>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
