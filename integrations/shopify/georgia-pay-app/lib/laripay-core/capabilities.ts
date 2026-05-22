/** Platform capabilities exposed in UI and docs (LariPay Core enterprise API). */

export type PlatformCapability = {
  id: string;
  method: string;
  path: string;
  tag: 'payments' | 'checkout' | 'ledger' | 'webhooks' | 'payouts' | 'subscriptions' | 'fraud' | 'auth' | 'admin' | 'open-banking' | 'sdk';
};

export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  { id: 'order', method: 'POST', path: '/api/v1/orders', tag: 'checkout' },
  { id: 'checkout-redirect', method: 'POST', path: '/api/v1/checkout/redirect', tag: 'checkout' },
  { id: 'checkout-embedded', method: 'POST', path: '/api/v1/checkout/embedded', tag: 'checkout' },
  { id: 'checkout-direct', method: 'POST', path: '/api/v1/checkout/direct', tag: 'checkout' },
  { id: 'checkout-hosted', method: 'GET', path: '/api/v1/checkout/hosted/:id', tag: 'checkout' },
  { id: 'checkout', method: 'POST', path: '/api/v1/checkout/sessions', tag: 'payments' },
  { id: 'intent', method: 'POST', path: '/api/v1/payment-intents', tag: 'payments' },
  { id: 'intent-get', method: 'GET', path: '/api/v1/payment-intents/:id', tag: 'payments' },
  { id: 'authorize', method: 'POST', path: '/api/v1/payment-intents/:id/authorize', tag: 'payments' },
  { id: 'capture', method: 'POST', path: '/api/v1/payment-intents/:id/capture', tag: 'payments' },
  { id: 'refund', method: 'POST', path: '/api/v1/payments/:id/refund', tag: 'payments' },
  { id: 'payment-link', method: 'POST', path: '/api/v1/payment-links', tag: 'payments' },
  { id: 'token-card', method: 'POST', path: '/api/v1/tokens/cards', tag: 'payments' },
  { id: 'opb-banks', method: 'GET', path: '/api/v1/open-banking/banks', tag: 'open-banking' },
  { id: 'opb-session', method: 'POST', path: '/api/v1/open-banking/sessions', tag: 'open-banking' },
  { id: 'wallet-balance', method: 'GET', path: '/api/v1/wallets/balance', tag: 'ledger' },
  { id: 'wallet-ledger', method: 'GET', path: '/api/v1/wallets/ledger', tag: 'ledger' },
  { id: 'payouts', method: 'GET', path: '/api/v1/payouts', tag: 'payouts' },
  { id: 'payout-create', method: 'POST', path: '/api/v1/payouts', tag: 'payouts' },
  { id: 'webhook-endpoint', method: 'POST', path: '/api/v1/webhooks/endpoints', tag: 'webhooks' },
  { id: 'webhook-deliveries', method: 'GET', path: '/api/v1/webhooks/deliveries', tag: 'webhooks' },
  { id: 'subscription-plans', method: 'GET', path: '/api/v1/subscription-plans', tag: 'subscriptions' },
  { id: 'subscriptions', method: 'POST', path: '/api/v1/subscriptions', tag: 'subscriptions' },
  { id: 'customers', method: 'POST', path: '/api/v1/customers', tag: 'auth' },
  { id: 'qr', method: 'POST', path: '/api/v1/qr/payments', tag: 'payments' },
  { id: 'fraud-score', method: 'POST', path: '/api/v1/fraud/score', tag: 'fraud' },
  { id: 'sdk-js', method: 'GET', path: '/sdk/checkout.js', tag: 'sdk' },
  { id: 'sdk-css', method: 'GET', path: '/sdk/checkout.css', tag: 'sdk' },
  { id: 'health', method: 'GET', path: '/api/health', tag: 'admin' },
];
