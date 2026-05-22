'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/i18n/LocaleProvider';

type CoreStatus = {
  mode: string;
  coreReachable?: boolean;
};

export function CoreModeBadge() {
  const { t } = useLocale();
  const p = t.pages.platform;
  const [status, setStatus] = useState<CoreStatus | null>(null);

  useEffect(() => {
    fetch('/api/laripay/core/status')
      .then((r) => r.json())
      .then((d) => setStatus(d as CoreStatus))
      .catch(() => setStatus({ mode: 'legacy' }));
  }, []);

  if (!status) return null;

  const isCore = status.mode === 'core';
  const unreachable = status.mode === 'core_unreachable';

  return (
    <Badge
      variant={isCore ? 'live' : unreachable ? 'default' : 'accent'}
      pulse={isCore}
      className="font-mono text-[10px] uppercase tracking-wider"
    >
      {isCore
        ? p.coreConnected
        : unreachable
          ? p.coreUnreachable
          : p.legacyMode}
    </Badge>
  );
}
