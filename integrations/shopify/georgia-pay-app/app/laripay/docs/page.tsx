import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingList, MarketingPage, MarketingSection } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Documentation — LariPay.ai',
  description: 'Quick start, API overview, and integration guides for LariPay.ai.',
};

export default function DocsPage() {
  return (
    <MarketingPage
      eyebrow="Developers"
      title="Documentation"
      description="Integrate checkout, webhooks, and merchant APIs in minutes. Use sandbox keys before going live."
      wide
    >
      <MarketingSection title="Quick start">
        <MarketingList
          items={[
            'Create a merchant via POST /api/laripay/signup (sandbox) or admin onboarding (production).',
            'Store your API key securely — it is shown once at creation.',
            'Create a checkout session: POST /api/v1/checkout/sessions with amount in tetri.',
            'Redirect the customer to the returned checkout_url.',
            'Listen for payment.succeeded on your webhook endpoint.',
          ]}
        />
        <p>
          <Link href="/laripay/onboard" className="text-accent-cyan hover:underline">
            Get sandbox API keys →
          </Link>
        </p>
      </MarketingSection>

      <MarketingSection title="Authentication">
        <p>
          Send your secret API key in the <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">Authorization: Bearer</code>{' '}
          header, or legacy <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">x-laripay-api-key</code> /{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">x-payka-api-key</code> header.
        </p>
      </MarketingSection>

      <section id="api" className="space-y-3 border-t border-white/[0.06] pt-8 scroll-mt-24">
        <h2 className="text-xl font-medium text-white/90">API reference</h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-canvas-elevated/60 font-mono text-sm">
          <table className="w-full text-left">
            <tbody className="divide-y divide-white/[0.06]">
              {[
                ['POST', '/api/v1/checkout/sessions', 'Create payment session'],
                ['GET', '/api/v1/checkout/sessions/:id', 'Session status'],
                ['POST', '/api/v1/payments', 'Create payment'],
                ['GET', '/api/v1/payments/:id', 'Payment details'],
                ['POST', '/api/v1/refunds', 'Refund'],
                ['GET', '/api/v1/balance', 'Merchant balance'],
                ['POST', '/api/v1/webhooks', 'Register webhook endpoint'],
                ['GET', '/api/health', 'Platform health'],
              ].map(([method, path, desc]) => (
                <tr key={path} className="text-white/60">
                  <td className="px-4 py-3 text-accent-cyan">{method}</td>
                  <td className="px-4 py-3 text-white/80">{path}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <MarketingSection title="Webhooks">
        <p>
          Configure <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">LARIPAY_WEBHOOK_URL</code> and verify
          signatures with the signing secret from your dashboard. Events include payment.succeeded,
          payment.failed, and refund.completed.
        </p>
      </MarketingSection>

      <MarketingSection title="SDKs & plugins">
        <p>
          <Link href="/laripay/integrations" className="text-accent-cyan hover:underline">
            Shopify, WooCommerce, WordPress →
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
