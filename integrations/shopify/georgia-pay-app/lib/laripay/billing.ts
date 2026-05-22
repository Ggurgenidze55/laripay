import type { Merchant } from '@prisma/client';
import { DEFAULT_COMMISSION_BPS } from './constants';

export interface FeeBreakdown {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feeMode: 'commission' | 'subscription';
  commissionRateBps: number;
}

export function isSubscriptionActive(merchant: Pick<Merchant, 'subscriptionActiveUntil'>): boolean {
  return Boolean(
    merchant.subscriptionActiveUntil && merchant.subscriptionActiveUntil > new Date(),
  );
}

/**
 * Platform revenue: 1% per payment (COMMISSION) or flat subscription (SUBSCRIPTION).
 */
export function computePlatformFee(
  amountGel: number,
  merchant: Pick<Merchant, 'billingMode' | 'commissionRateBps' | 'subscriptionActiveUntil'>,
): FeeBreakdown {
  const gross = roundMoney(amountGel);
  const bps = merchant.commissionRateBps ?? DEFAULT_COMMISSION_BPS;

  if (merchant.billingMode === 'SUBSCRIPTION' && isSubscriptionActive(merchant)) {
    return {
      grossAmount: gross,
      platformFee: 0,
      netAmount: gross,
      feeMode: 'subscription',
      commissionRateBps: 0,
    };
  }

  const platformFee = roundMoney((gross * bps) / 10000);
  return {
    grossAmount: gross,
    platformFee,
    netAmount: roundMoney(gross - platformFee),
    feeMode: 'commission',
    commissionRateBps: bps,
  };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatBpsAsPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}
