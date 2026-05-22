/** Shared navigation & footer links for LariPay.ai marketing site */

export const SITE_NAV = [
  { href: '/laripay', label: 'Platform' },
  { href: '/laripay/pricing', label: 'Pricing' },
  { href: '/laripay/docs', label: 'Docs' },
  { href: '/laripay/onboard', label: 'Developers' },
  { href: '/demo', label: 'Demo' },
] as const;

export const FOOTER_COLUMNS = {
  product: [
    { href: '/laripay', label: 'Platform' },
    { href: '/laripay/pricing', label: 'Pricing' },
    { href: '/laripay/integrations', label: 'Integrations' },
    { href: '/laripay/security', label: 'Security' },
    { href: '/laripay/status', label: 'Status' },
  ],
  developers: [
    { href: '/laripay/docs', label: 'Documentation' },
    { href: '/laripay/docs#api', label: 'API reference' },
    { href: '/laripay/onboard', label: 'Get API keys' },
    { href: '/demo', label: 'Live demo' },
    { href: '/laripay/dashboard', label: 'Console' },
  ],
  company: [
    { href: '/laripay/about', label: 'About' },
    { href: '/laripay/contact', label: 'Contact' },
    { href: '/laripay/contact#support', label: 'Support' },
  ],
  legal: [
    { href: '/laripay/legal/privacy', label: 'Privacy Policy' },
    { href: '/laripay/legal/terms', label: 'Terms of Service' },
    { href: '/laripay/legal/cookies', label: 'Cookie Policy' },
    { href: '/laripay/legal/compliance', label: 'Compliance' },
  ],
} as const;

export const COMPANY = {
  name: 'LariPay.ai',
  tagline: 'Payments infrastructure for Georgia',
  email: 'hello@laripay.ai',
  supportEmail: 'support@laripay.ai',
  year: new Date().getFullYear(),
} as const;
