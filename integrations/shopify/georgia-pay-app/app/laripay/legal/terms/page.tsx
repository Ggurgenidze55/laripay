import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';
import { COMPANY } from '@/lib/site-links';

export const metadata: Metadata = {
  title: 'Terms of Service — LariPay.ai',
  description: 'Terms governing use of LariPay.ai platform and APIs.',
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Terms of Service"
      description={`By using ${COMPANY.name}, you agree to these terms. Merchants must also comply with partner bank agreements.`}
    >
      <MarketingSection title="Service">
        <p>
          LariPay.ai provides payment facilitation technology connecting merchants to licensed payment
          providers. We do not hold customer funds unless explicitly stated in a separate agreement.
        </p>
      </MarketingSection>
      <MarketingSection title="Merchant responsibilities">
        <p>
          You must provide accurate business information, comply with Georgian law, obtain required
          licenses for your industry, and use the API only for lawful commerce. You are responsible for
          customer support related to your goods and services.
        </p>
      </MarketingSection>
      <MarketingSection title="Fees">
        <p>
          Fees follow your selected plan (commission or subscription). Chargebacks and bank penalties may
          be passed through per your merchant agreement.
        </p>
      </MarketingSection>
      <MarketingSection title="Availability">
        <p>
          We target high availability but do not guarantee uninterrupted service. Maintenance windows will
          be communicated when possible.
        </p>
      </MarketingSection>
      <MarketingSection title="Limitation of liability">
        <p>
          To the extent permitted by law, LariPay.ai is not liable for indirect damages. Direct liability is
          capped to fees paid in the twelve months preceding the claim.
        </p>
      </MarketingSection>
      <MarketingSection title="Governing law">
        <p>These terms are governed by the laws of Georgia. Disputes are subject to Georgian courts.</p>
      </MarketingSection>
    </MarketingPage>
  );
}
