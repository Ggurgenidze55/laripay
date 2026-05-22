import type { Metadata } from 'next';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Security — LariPay.ai',
  description: 'Security practices, encryption, and compliance for LariPay.ai payment infrastructure.',
};

export default function SecurityPage() {
  return (
    <MarketingPage
      eyebrow="Trust"
      title="Security"
      description="We design for least privilege, encrypted transport, and auditable payment flows aligned with partner bank requirements."
    >
      <MarketingSection title="Infrastructure">
        <MarketingList
          items={[
            'TLS 1.2+ for all public endpoints; HSTS on production domains.',
            'Secrets stored as environment variables — never in source control.',
            'Production database isolation with PostgreSQL and role-scoped access.',
            'Webhook payloads signed with per-merchant secrets.',
          ]}
        />
      </MarketingSection>
      <MarketingSection title="Application security">
        <MarketingList
          items={[
            'API keys hashed at rest; raw keys shown only once at issuance.',
            'Portal sessions use HTTP-only cookies with secure flags in production.',
            'Rate limiting and idempotency keys on payment creation endpoints.',
            'Regular dependency updates and container-based deployments.',
          ]}
        />
      </MarketingSection>
      <MarketingSection title="Incident response">
        <p>
          Security issues can be reported to security@laripay.ai. We acknowledge reports within 48 hours
          and coordinate disclosure responsibly.
        </p>
      </MarketingSection>
      <MarketingSection title="Compliance">
        <p>
          Payment processing is subject to Georgian National Bank rules and partner bank agreements.
          See our{' '}
          <a href="/laripay/legal/compliance" className="text-accent-cyan hover:underline">
            compliance overview
          </a>{' '}
          for more detail.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
