import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

export const INTEGRATION_SLUGS = [
  'shopify',
  'woocommerce',
  'commerce-php',
  'delivery',
  'warehouse',
  'api',
] as const;

export type IntegrationSlug = (typeof INTEGRATION_SLUGS)[number];

export function isIntegrationSlug(value: string): value is IntegrationSlug {
  return (INTEGRATION_SLUGS as readonly string[]).includes(value);
}

export function getIntegrationPlatform(locale: Locale, slug: IntegrationSlug) {
  const platforms = getDictionary(locale).landing.integrationsSection.platforms;
  return platforms.find((p) => p.slug === slug) ?? null;
}
