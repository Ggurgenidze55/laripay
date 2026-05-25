import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureLariPayMerchantForShop } from '@/lib/laripay/provision-merchant';
import { activateService } from '@/lib/laripay/service-gate';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  const token = request.nextUrl.searchParams.get('token');

  if (!shop || !token) {
    return NextResponse.json({ error: 'shop and token params required' }, { status: 400 });
  }

  await prisma.shop.upsert({
    where: { domain: shop },
    create: { domain: shop, accessToken: token },
    update: { accessToken: token },
  });

  const merchantId = await ensureLariPayMerchantForShop(shop);
  if (merchantId) {
    await activateService(merchantId, 'shopify', {
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priceGel: 0,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, shop, merchant_id: merchantId, message: 'Token saved and merchant provisioned' });
}
