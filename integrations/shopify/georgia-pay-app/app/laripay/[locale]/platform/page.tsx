import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { PlatformCapabilities } from '@/components/platform/platform-capabilities';
import { CoreModeBadge } from '@/components/platform/core-mode-badge';
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
    <MarketingPage
      eyebrow={p.eyebrow}
      title={p.title}
      description={p.description}
      wide
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <CoreModeBadge />
        <Link href={localePath(locale, 'playground')}>
          <Button size="sm">{p.openPlayground}</Button>
        </Link>
        <Link href={localePath(locale, 'dashboard')}>
          <Button variant="ghost" size="sm">
            {p.openConsole}
          </Button>
        </Link>
      </div>
      <PlatformCapabilities />
    </MarketingPage>
  );
}
