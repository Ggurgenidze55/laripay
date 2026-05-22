import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/routing';

/** Internal marketing routes (no locale prefix). */
export const SITE_ROUTES = {
  home: '',
  pricing: 'pricing',
  docs: 'docs',
  docsApi: 'docs#api',
  onboard: 'onboard',
  login: 'login',
  demo: 'demo',
  dashboard: 'dashboard',
  admin: 'admin',
  integrations: 'integrations',
  integrationsShopify: 'integrations#shopify',
  integrationsWoo: 'integrations#woocommerce',
  integrationsApi: 'integrations#api',
  security: 'security',
  status: 'status',
  platform: 'platform',
  playground: 'playground',
  contact: 'contact',
  contactSupport: 'contact#support',
  about: 'about',
  legalPrivacy: 'legal/privacy',
  legalTerms: 'legal/terms',
  legalCookies: 'legal/cookies',
  legalCompliance: 'legal/compliance',
} as const;

export type SiteRouteKey = keyof typeof SITE_ROUTES;

const API_ROUTES = {
  setup: '/api/laripay/setup',
  health: '/api/health',
} as const;

export type ApiRouteKey = keyof typeof API_ROUTES;

export function resolveSiteHref(locale: Locale, target: SiteRouteKey | ApiRouteKey | string): string {
  if (target in API_ROUTES) {
    return API_ROUTES[target as ApiRouteKey];
  }

  if (target in SITE_ROUTES) {
    const path = SITE_ROUTES[target as SiteRouteKey];
    const [sub, hash] = path.split('#');
    const base = localePath(locale, sub);
    return hash ? `${base}#${hash}` : base;
  }

  // Legacy: `/laripay/foo` or `foo`
  if (target.startsWith('/api') || target.startsWith('http') || target.startsWith('mailto:')) {
    return target;
  }
  const cleaned = target.replace(/^\/laripay\//, '').replace(/^(en|ka)\//, '');
  const [sub, hash] = cleaned.split('#');
  const base = localePath(locale, sub.replace(/^\//, ''));
  return hash ? `${base}#${hash}` : base;
}

/** Map integration product name → route key */
export function integrationRouteKey(name: string): SiteRouteKey {
  const n = name.toLowerCase();
  if (n.includes('shopify')) return 'integrationsShopify';
  if (n.includes('woo') || n.includes('wordpress')) return 'integrationsWoo';
  if (n.includes('rest') || n.includes('api') || n.includes('custom')) return 'docsApi';
  return 'integrations';
}
