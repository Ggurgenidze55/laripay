import type { Metadata } from 'next';
import { MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Cookie Policy — LariPay.ai',
  description: 'How LariPay.ai uses cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="We use cookies and local storage to operate the merchant console and improve the marketing site."
    >
      <MarketingSection title="Essential cookies">
        <p>
          Required for authentication, session management, and security (e.g. portal login, CSRF
          protection). These cannot be disabled while using the console.
        </p>
      </MarketingSection>
      <MarketingSection title="Analytics">
        <p>
          We may use privacy-friendly analytics to understand feature usage. No third-party advertising
          cookies are used on the payment console.
        </p>
      </MarketingSection>
      <MarketingSection title="Managing preferences">
        <p>
          You can clear cookies via your browser settings. Disabling essential cookies may prevent login to
          the merchant dashboard.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
