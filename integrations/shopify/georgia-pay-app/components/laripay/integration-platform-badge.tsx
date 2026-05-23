'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type IntegrationPlatformId,
  isIntegrationPlatformId,
} from '@/lib/laripay/integration-platform';

const PLATFORM_STYLES: Record<IntegrationPlatformId, string> = {
  shopify: 'border-[#95bf47]/40 bg-[#95bf47]/10 text-[#b8e986]',
  woocommerce: 'border-[#7f54b3]/40 bg-[#7f54b3]/10 text-[#c4a7e8]',
  wordpress: 'border-[#21759b]/40 bg-[#21759b]/10 text-[#7eb8e0]',
  cscart: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  opencart: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  prestashop: 'border-pink-500/40 bg-pink-500/10 text-pink-200',
  magento: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
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
  const safePlatform = isIntegrationPlatformId(platform) ? platform : 'api';
  return (
    <span title={title} className="inline-flex">
      <Badge
        variant="default"
        className={cn('font-medium', PLATFORM_STYLES[safePlatform], className)}
      >
        {label}
        {inferred ? ' · auto' : ''}
      </Badge>
    </span>
  );
}
