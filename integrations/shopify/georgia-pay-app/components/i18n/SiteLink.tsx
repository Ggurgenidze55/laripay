'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { resolveSiteHref, type ApiRouteKey, type SiteRouteKey } from '@/lib/site-routes';

type SiteLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  /** Named route from site-routes.ts */
  route?: SiteRouteKey | ApiRouteKey;
  /** Raw path — auto-localized via LocaleProvider */
  href?: string;
};

export function SiteLink({ route, href, children, ...props }: SiteLinkProps) {
  const { locale, href: localize } = useLocale();
  const to = route ? resolveSiteHref(locale, route) : href ? localize(href) : '#';
  return (
    <Link href={to} {...props}>
      {children}
    </Link>
  );
}
