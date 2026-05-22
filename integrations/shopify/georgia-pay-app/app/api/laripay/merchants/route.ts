import { NextRequest } from 'next/server';
import { requireAdminOrError } from '@/lib/laripay/auth';
import { createMerchant } from '@/lib/laripay/onboard';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function POST(request: NextRequest) {
  const adminErr = requireAdminOrError(request);
  if (adminErr) return adminErr;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email) {
    return laripayError('name and email are required');
  }

  try {
    const { merchant, secretKey } = await createMerchant({
      name,
      email,
      slug: body.slug ? String(body.slug) : undefined,
      billingMode: body.billing_mode as 'COMMISSION' | 'SUBSCRIPTION' | undefined,
      commissionRateBps: body.commission_rate_bps
        ? Number(body.commission_rate_bps)
        : undefined,
      subscriptionPlanCode: body.subscription_plan
        ? String(body.subscription_plan)
        : undefined,
      subscriptionMonths: body.subscription_months
        ? Number(body.subscription_months)
        : undefined,
      defaultProvider: body.default_provider as 'tbc' | 'bog' | undefined,
    });

    return laripayJson(
      {
        merchant: {
          id: merchant.id,
          slug: merchant.slug,
          email: merchant.email,
          billing_mode: merchant.billingMode,
          commission_rate_bps: merchant.commissionRateBps,
        },
        api_key: secretKey,
        message: 'Store api_key securely — it is shown only once.',
      },
      201,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return laripayError(message, 422);
  }
}
