'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

const PLATFORM_STYLES: Record<IntegrationPlatformId, string> = {
  shopify: 'border-[#95bf47]/40 bg-[#95bf47]/10 text-[#b8e986]',
  woocommerce: 'border-[#7f54b3]/40 bg-[#7f54b3]/10 text-[#c4a7e8]',
  wordpress: 'border-[#21759b]/40 bg-[#21759b]/10 text-[#7eb8e0]',
  api: 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan',
  custom: 'border-border-strong bg-foreground/[0.06] text-foreground-muted',
};

export function IntegrationPlatformBadge({
  platform,
  label,
  inferred,
  className,
  title,
}: {
  platform: IntegrationPlatformId;
  label: string;
  inferred?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span title={title} className="inline-flex">
      <Badge variant="default" className={cn('font-medium', PLATFORM_STYLES[platform], className)}>
        {label}
        {inferred ? ' · auto' : ''}
      </Badge>
    </span>
  );
}
