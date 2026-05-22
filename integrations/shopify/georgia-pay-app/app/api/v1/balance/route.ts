import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { isSubscriptionActive } from '@/lib/laripay/billing';
import { formatBpsAsPercent } from '@/lib/laripay/billing';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: auth.merchant.id },
    include: { subscriptionPlan: true },
  });

  if (!merchant) {
    return laripayError('Merchant not found', 404);
  }

  const succeeded = await prisma.paykaPayment.findMany({
    where: { merchantId: merchant.id, status: 'succeeded' },
    select: { grossAmount: true, platformFee: true, netAmount: true },
  });

  const volume = succeeded.reduce((s, p) => s + p.grossAmount, 0);
  const feesCollected = succeeded.reduce((s, p) => s + p.platformFee, 0);
  const netToMerchant = succeeded.reduce((s, p) => s + p.netAmount, 0);

  return laripayJson({
    object: 'balance',
    currency: 'GEL',
    billing_mode: merchant.billingMode,
    commission_rate: formatBpsAsPercent(merchant.commissionRateBps),
    subscription_active: isSubscriptionActive(merchant),
    subscription_plan: merchant.subscriptionPlan?.code || null,
    available: [
      {
        amount: netToMerchant,
        currency: 'GEL',
        description: 'Net volume after LariPay.ai fees (reporting; settlement via bank contract)',
      },
    ],
    lifetime: {
      payment_count: succeeded.length,
      gross_volume: volume,
      platform_fees: feesCollected,
    },
  });
}
