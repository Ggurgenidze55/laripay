import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/pricing-section';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — LariPay.ai',
  description: 'Transparent pricing for Georgian payment processing — commission or subscription plans.',
};

const FAQ = [
  {
    q: 'Is there a setup fee?',
    a: 'No setup fee for standard onboarding. Enterprise integrations may include custom SLAs.',
  },
  {
    q: 'Which banks are supported?',
    a: 'TBC Pay and BOG Pay in sandbox and production, subject to merchant approval.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes — contact support to move between commission and subscription billing.',
  },
];

export default function PricingPage() {
  return (
    <div className="-mx-6 space-y-16 lg:-mx-8">
      <div className="px-6 lg:px-8">
        <MarketingPage
          eyebrow="Pricing"
          title="Plans that scale with your volume"
          description="Start in sandbox for free. Choose commission or flat monthly billing when you go live."
        >
          <p className="text-white/45">All plans include API access, webhooks, and the merchant console.</p>
        </MarketingPage>
      </div>
      <PricingSection />
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <MarketingSection title="FAQ">
          <dl className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-white/85">{item.q}</dt>
                <dd className="mt-2 text-white/55">{item.a}</dd>
              </div>
            ))}
          </dl>
        </MarketingSection>
        <p className="mt-8 text-sm text-white/45">
          Questions?{' '}
          <Link href="/laripay/contact" className="text-accent-cyan hover:underline">
            Contact sales
          </Link>
        </p>
      </div>
    </div>
  );
}
