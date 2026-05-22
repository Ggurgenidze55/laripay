import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Integrations — LariPay.ai',
  description: 'Shopify, WooCommerce, WordPress, and direct API integrations for Georgian payments.',
};

const INTEGRATIONS = [
  {
    name: 'REST API',
    desc: 'Full control — checkout sessions, payments, refunds, webhooks.',
    href: '/laripay/docs',
    status: 'Available',
  },
  {
    name: 'Shopify',
    desc: 'Payment app for Shopify stores selling in GEL.',
    href: '/laripay/docs',
    status: 'Available',
  },
  {
    name: 'WooCommerce',
    desc: 'WordPress plugin for WooCommerce checkout.',
    href: '/laripay/docs',
    status: 'Beta',
  },
  {
    name: 'WordPress',
    desc: 'Georgia Pay bridge for custom WordPress sites.',
    href: '/laripay/docs',
    status: 'Beta',
  },
];

export default function IntegrationsPage() {
  return (
    <MarketingPage
      eyebrow="Product"
      title="Integrations"
      description="Connect your stack to TBC Pay and BOG Pay through LariPay — one API, multiple channels."
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <Card key={item.name} className="p-6">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-medium text-white/90">{item.name}</h3>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/45">
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/50">{item.desc}</p>
            <Link href={item.href} className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
              View docs →
            </Link>
          </Card>
        ))}
      </div>
      <MarketingSection title="Custom platforms">
        <p>
          Marketplaces, ERPs, and mobile apps can integrate directly. Contact us for high-volume routing
          and dedicated webhook endpoints.
        </p>
        <p>
          <Link href="/laripay/contact" className="text-accent-cyan hover:underline">
            Talk to partnerships →
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
