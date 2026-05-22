import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Compliance — LariPay.ai',
  description: 'Regulatory and compliance information for LariPay.ai in Georgia.',
};

export default function CompliancePage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Compliance"
      description="Overview of regulatory context for payment services in Georgia. Not legal advice — consult qualified counsel for your business."
    >
      <MarketingSection title="Regulatory framework">
        <p>
          Payment activities in Georgia are supervised by the National Bank of Georgia. Merchants and
          payment facilitators must operate within applicable licensing and reporting rules.
        </p>
      </MarketingSection>
      <MarketingSection title="Partner banks">
        <p>
          LariPay.ai integrates with TBC Pay and BOG Pay under their respective merchant onboarding and
          technical requirements. Production access requires approval from the relevant bank.
        </p>
      </MarketingSection>
      <MarketingSection title="KYC & onboarding">
        <MarketingList
          items={[
            'Business identification and beneficial ownership verification.',
            'Description of goods/services and expected transaction volumes.',
            'Sandbox testing before production credentials are issued.',
          ]}
        />
      </MarketingSection>
      <MarketingSection title="AML">
        <p>
          Suspicious activity may be reported according to Georgian AML legislation. Merchants must not use
          the platform for prohibited or high-risk activities without disclosure.
        </p>
      </MarketingSection>
      <MarketingSection title="Related policies">
        <p>
          <Link href="/laripay/legal/privacy" className="text-accent-cyan hover:underline">
            Privacy Policy
          </Link>
          {' · '}
          <Link href="/laripay/legal/terms" className="text-accent-cyan hover:underline">
            Terms of Service
          </Link>
          {' · '}
          <Link href="/laripay/security" className="text-accent-cyan hover:underline">
            Security
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
