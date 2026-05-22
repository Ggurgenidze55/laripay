import { NextRequest } from 'next/server';
import { requireAdminOrError } from '@/lib/laripay/auth';
import { activateSubscription } from '@/lib/laripay/onboard';
import prisma from '@/lib/prisma';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { resolveMerchantId } from '@/lib/laripay/resolve-merchant';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminErr = requireAdminOrError(request);
  if (adminErr) return adminErr;

  const merchantId = await resolveMerchantId(params.id);
  if (!merchantId) return laripayError('Merchant not found', 404);

  const body = await request.json();
  const billingMode = body.billing_mode as string | undefined;

  if (billingMode === 'SUBSCRIPTION' && body.subscription_plan) {
    const merchant = await activateSubscription(
      merchantId,
      String(body.subscription_plan),
      Number(body.subscription_months) || 1,
    );
    return laripayJson({
      id: merchant.id,
      billing_mode: merchant.billingMode,
      subscription_active_until: merchant.subscriptionActiveUntil,
      plan: merchant.subscriptionPlan?.code,
    });
  }

  if (billingMode === 'COMMISSION') {
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        billingMode: 'COMMISSION',
        commissionRateBps: body.commission_rate_bps
          ? Number(body.commission_rate_bps)
          : 100,
      },
    });
    return laripayJson({
      id: merchant.id,
      billing_mode: merchant.billingMode,
      commission_rate_bps: merchant.commissionRateBps,
    });
  }

  return laripayError('billing_mode must be COMMISSION or SUBSCRIPTION with plan');
}
