import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localePath } from '@/lib/i18n/routing';

export const COMPANY = {
  name: 'LariPay.ai',
  email: 'hello@laripay.ai',
  supportEmail: 'support@laripay.ai',
  year: new Date().getFullYear(),
} as const;

export function getSiteNav(locale: Locale) {
  const t = getDictionary(locale);
  return [
    { href: localePath(locale), label: t.nav.platform },
    { href: localePath(locale, 'pricing'), label: t.nav.pricing },
    { href: localePath(locale, 'docs'), label: t.nav.docs },
    { href: localePath(locale, 'onboard'), label: t.nav.developers },
    { href: localePath(locale, 'demo'), label: t.nav.demo },
  ] as const;
}

export function getFooterColumns(locale: Locale) {
  const t = getDictionary(locale);
  return {
    product: [
      { href: localePath(locale), label: t.nav.platform },
      { href: localePath(locale, 'pricing'), label: t.nav.pricing },
      { href: localePath(locale, 'integrations'), label: t.footer.integrations },
      { href: localePath(locale, 'security'), label: t.footer.security },
      { href: localePath(locale, 'status'), label: t.footer.status },
    ],
    developers: [
      { href: localePath(locale, 'docs'), label: t.footer.documentation },
      { href: `${localePath(locale, 'docs')}#api`, label: t.footer.apiReference },
      { href: localePath(locale, 'onboard'), label: t.footer.getApiKeys },
      { href: localePath(locale, 'demo'), label: t.footer.liveDemo },
      { href: localePath(locale, 'dashboard'), label: t.nav.console },
    ],
    company: [
      { href: localePath(locale, 'about'), label: t.footer.about },
      { href: localePath(locale, 'contact'), label: t.footer.contact },
      { href: `${localePath(locale, 'contact')}#support`, label: t.footer.support },
    ],
    legal: [
      { href: localePath(locale, 'legal/privacy'), label: t.footer.privacy },
      { href: localePath(locale, 'legal/terms'), label: t.footer.terms },
      { href: localePath(locale, 'legal/cookies'), label: t.footer.cookies },
      { href: localePath(locale, 'legal/compliance'), label: t.footer.compliance },
    ],
  } as const;
}

export function getFooterColumnTitles(locale: Locale) {
  const t = getDictionary(locale);
  return {
    product: t.footer.product,
    developers: t.footer.developers,
    company: t.footer.company,
    legal: t.footer.legal,
  };
}
