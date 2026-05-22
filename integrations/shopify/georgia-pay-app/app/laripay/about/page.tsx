import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'About — LariPay.ai',
  description: 'Mission and team behind Georgia’s developer-first payments infrastructure.',
};

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="About LariPay.ai"
      description="We build payment infrastructure so Georgian businesses can accept GEL online with bank-grade reliability and developer-friendly APIs."
    >
      <MarketingSection title="Our mission">
        <p>
          LariPay.ai connects merchants to TBC Pay and BOG Pay through a single integration — checkout
          sessions, refunds, webhooks, and a merchant console. We focus on clarity for developers and
          operational trust for finance teams.
        </p>
      </MarketingSection>
      <MarketingSection title="What we believe">
        <MarketingList
          items={[
            'Payments should feel like infrastructure, not a bolt-on.',
            'Georgian commerce deserves first-class GEL rails, not workarounds.',
            'Transparent pricing and observable systems build long-term trust.',
          ]}
        />
      </MarketingSection>
      <MarketingSection title="Where we operate">
        <p>
          We serve merchants and platforms operating in Georgia, with sandbox environments for testing
          and production paths aligned with partner bank requirements.
        </p>
      </MarketingSection>
      <p>
        <Link href="/laripay/contact" className="text-accent-cyan hover:underline">
          Get in touch →
        </Link>
      </p>
    </MarketingPage>
  );
}
