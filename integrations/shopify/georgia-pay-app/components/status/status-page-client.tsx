'use client';

import { StatusServices } from '@/components/motion/interactive';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function StatusPageClient() {
  const { t } = useLocale();
  const p = t.pages.status;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
      <StatusServices services={p.services} operationalLabel={p.operational} />
      <p className="mt-8 text-sm text-foreground-muted">
        Health probe:{' '}
        <a href="/api/health" className="text-accent-cyan hover:underline">
          GET /api/health
        </a>
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Badge variant="live" pulse>
          {p.operational}
        </Badge>
      </div>
    </MarketingPage>
  );
}
