import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { localePath } from '@/lib/i18n/routing';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.platform;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function PlatformPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.platform;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description} wide>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {p.features.map((item) => (
          <li
            key={item.title}
            className="landing-card p-6"
          >
            <h3 className="text-card-h text-tx-primary dark:text-zinc-50">{item.title}</h3>
            <p className="mt-2 text-sm text-tx-body dark:text-zinc-300">{item.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href={localePath(locale, 'docs')}>
          <Button size="sm">{p.openDocs}</Button>
        </Link>
        <Link href={localePath(locale, 'pricing')}>
          <Button variant="ghost" size="sm">
            {p.openPricing}
          </Button>
        </Link>
        <Link href={localePath(locale, 'dashboard')}>
          <Button variant="ghost" size="sm">
            {p.openConsole}
          </Button>
        </Link>
      </div>
    </MarketingPage>
  );
}
