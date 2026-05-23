import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { ensureLariPaySeed } from '@/lib/laripay/seed';

/** Dev bootstrap: subscription plans + seed merchant. */
export async function GET() {
  await ensureLariPaySeed();

  const merchant = await prisma.merchant.findUnique({
    where: { slug: 'demo-merchant' },
    include: { subscriptionPlan: true },
  });

  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true } });

  return NextResponse.json({
    ok: true,
    security: {
      checkout: 'Bank-hosted only (TBC/BOG redirect). LariPay never stores card or account credentials.',
    },
    merchant: merchant
      ? {
          id: merchant.id,
          slug: merchant.slug,
          billing_mode: merchant.billingMode,
          commission: '1% when COMMISSION; 0% with active subscription',
        }
      : null,
    plans,
    api: {
      create_checkout: 'POST /api/v1/checkout/sessions → response.url (bank page)',
      get_session: 'GET /api/v1/checkout/sessions/:id',
      get_payment: 'GET /api/v1/payments/:id',
      webhooks: 'POST /api/v1/webhooks',
    },
    admin: {
      create_merchant: 'POST /api/laripay/merchants',
      activate_subscription: 'PATCH /api/laripay/merchants/:id/billing',
      header: 'X-LariPay-Admin-Secret',
    },
  });
}
