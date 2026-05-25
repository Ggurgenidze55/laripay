/** 100 basis points = 1% platform commission */
export const DEFAULT_COMMISSION_BPS = 100;

export const BILLING_MODES = ['COMMISSION', 'SUBSCRIPTION'] as const;
export type BillingMode = (typeof BILLING_MODES)[number];

export const CHECKOUT_SESSION_TTL_MS = 30 * 60 * 1000;

export const LARIPAY_EVENTS = [
  'checkout.session.created',
  'checkout.session.completed',
  'checkout.session.expired',
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
] as const;

export type LariPayEvent = (typeof LARIPAY_EVENTS)[number];
