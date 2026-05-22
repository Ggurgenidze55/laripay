import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { COMPANY } from '@/lib/site-links';

export const metadata: Metadata = {
  title: 'Privacy Policy — LariPay.ai',
  description: 'How LariPay.ai collects, uses, and protects personal data.',
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`Last updated: May 2026. This policy describes how ${COMPANY.name} processes personal data.`}
    >
      <MarketingSection title="Data we collect">
        <p>
          We collect business contact information, merchant account details, transaction metadata (amounts,
          statuses, references), technical logs, and API usage data necessary to operate payment services.
        </p>
      </MarketingSection>
      <MarketingSection title="How we use data">
        <p>
          Data is used to process payments, prevent fraud, provide support, improve the platform, and meet
          legal obligations. We do not sell personal data to third parties.
        </p>
      </MarketingSection>
      <MarketingSection title="Sharing">
        <p>
          We share data with partner banks (TBC, BOG), infrastructure providers, and authorities when
          required by law. Sub-processors are bound by confidentiality and security requirements.
        </p>
      </MarketingSection>
      <MarketingSection title="Retention & rights">
        <p>
          Records are retained as required for financial regulations. You may request access, correction,
          or deletion where applicable by contacting {COMPANY.email}.
        </p>
      </MarketingSection>
      <MarketingSection title="Contact">
        <p>Data protection inquiries: {COMPANY.email}</p>
      </MarketingSection>
    </MarketingPage>
  );
}
