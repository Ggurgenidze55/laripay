'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusServices } from '@/components/motion/interactive';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { CoreModeBadge } from '@/components/platform/core-mode-badge';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/i18n/LocaleProvider';

type CoreStatus = {
  mode: string;
  coreReachable?: boolean;
  docs?: string | null;
};

export function StatusPageClient() {
  const { t } = useLocale();
  const p = t.pages.status;
  const [core, setCore] = useState<CoreStatus | null>(null);

  useEffect(() => {
    fetch('/api/laripay/core/status')
      .then((r) => r.json())
      .then((d) => setCore(d as CoreStatus))
      .catch(() => setCore({ mode: 'legacy' }));
  }, []);

  const services = [...p.services];
  if (core?.mode === 'core') {
    services.push(p.coreApi);
  } else if (core?.mode === 'core_unreachable') {
    services.push(p.coreApiDegraded);
  }

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
      <div className="mb-6">
        <CoreModeBadge />
      </div>
      <StatusServices services={services} operationalLabel={p.operational} />
      <p className="mt-8 text-sm text-foreground-muted">
        {p.liveProbe}{' '}
        <Link href="/api/health" className="text-accent-cyan hover:underline">
          GET /api/health
        </Link>
        {' · '}
        <Link href="/api/laripay/core/status" className="text-accent-cyan hover:underline">
          GET /api/laripay/core/status
        </Link>
      </p>
      {core?.docs ? (
        <p className="mt-2 text-sm text-foreground-muted">
          {p.coreDocs}{' '}
          <a href={core.docs} className="text-accent-cyan hover:underline" target="_blank" rel="noreferrer">
            Swagger
          </a>
        </p>
      ) : null}
      {core?.mode === 'legacy' ? (
        <Badge variant="accent" className="mt-4">
          {p.legacyNote}
        </Badge>
      ) : null}
    </MarketingPage>
  );
}
