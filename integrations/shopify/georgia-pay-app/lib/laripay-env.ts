/**
 * LariPay.ai environment helpers (mirrors src/env.cjs for Next.js).
 * Reads LARIPAY_* first, then legacy PAYKA_*.
 */

export function platformEnv(name: string): string | undefined {
  return process.env[`LARIPAY_${name}`] ?? process.env[`PAYKA_${name}`];
}

export function isTbcSandbox(): boolean {
  return (process.env.TBC_ENV || 'sandbox').toLowerCase() === 'sandbox';
}

export function isBogSandbox(): boolean {
  return (process.env.BOG_ENV || 'sandbox').toLowerCase() === 'sandbox';
}

export function getLariPayReturnUrl(paymentId?: string): string | null {
  const base = platformEnv('RETURN_URL');
  if (!base) return null;
  const url = new URL(base);
  if (paymentId) {
    url.searchParams.set('paymentId', paymentId);
  }
  return url.toString();
}

export function getLariPayWebhookUrl(provider?: 'tbc' | 'bog'): string | null {
  const base = platformEnv('WEBHOOK_URL');
  if (!base) return null;
  const normalized = base.replace(/\/$/, '');
  if (provider && platformEnv('WEBHOOK_PER_PROVIDER') === '1') {
    return `${normalized}/${provider}`;
  }
  return normalized;
}

export function resolveReturnUrl(paymentId: string, fallback: string): string {
  return getLariPayReturnUrl(paymentId) || fallback;
}

export function resolveWebhookUrl(provider: 'tbc' | 'bog', fallback: string): string {
  return getLariPayWebhookUrl(provider) || fallback;
}

/** @deprecated Use getLariPayReturnUrl */
export const getPaykaReturnUrl = getLariPayReturnUrl;
/** @deprecated Use getLariPayWebhookUrl */
export const getPaykaWebhookUrl = getLariPayWebhookUrl;
