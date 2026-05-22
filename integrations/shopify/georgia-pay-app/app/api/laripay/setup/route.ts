import { platformEnv } from '@/lib/laripay-env';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { ensureLariPaySeed } from '@/lib/laripay/seed';
import { hashApiKey } from '@/lib/laripay/crypto';

/**
 * Dev bootstrap: plans + demo merchant. Returns demo API key from env if set.
 */
export async function GET() {
  const seed = await ensureLariPaySeed();

  const merchant = await prisma.merchant.findUnique({
    where: { slug: 'demo-merchant' },
    include: {
      apiKeys: { where: { revokedAt: null }, take: 1 },
      subscriptionPlan: true,
    },
  });

  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true } });

  const demoKeyFromEnv = platformEnv('DEMO_API_KEY');
  let demoApiKey: string | null = seed.secretKey || demoKeyFromEnv || null;
  let demoKeyNote = seed.secretKey
    ? 'Copy demo_api_key into PAYKA_DEMO_API_KEY in .env — shown only once.'
    : 'Set PAYKA_DEMO_API_KEY in .env to your sk_test_ key.';

  if (demoKeyFromEnv && merchant?.apiKeys[0]) {
    const hash = hashApiKey(demoKeyFromEnv);
    if (merchant.apiKeys[0].keyHash !== hash) {
      demoKeyNote = 'PAYKA_DEMO_API_KEY does not match stored key — rotate via POST /api/laripay/merchants';
    } else {
      demoKeyNote = 'Using PAYKA_DEMO_API_KEY from .env';
    }
  }

  return NextResponse.json({
    ok: true,
    merchant: merchant
      ? {
          id: merchant.id,
          slug: merchant.slug,
          billing_mode: merchant.billingMode,
          commission: '1% (100 bps) when COMMISSION',
        }
      : null,
    demo_api_key: demoApiKey,
    demo_key_note: demoKeyNote,
    plans,
    api: {
      create_checkout: 'POST /api/v1/checkout/sessions',
      get_session: 'GET /api/v1/checkout/sessions/:id',
      get_payment: 'GET /api/v1/payments/:id',
      balance: 'GET /api/v1/balance',
    },
    admin: {
      create_merchant: 'POST /api/laripay/merchants',
      header: 'X-LariPay-Admin-Secret',
    },
  });
}
