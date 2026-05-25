import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { registerWebhook } from '@/lib/shopify-admin';
import { ensureLariPayMerchantForShop } from '@/lib/laripay/provision-merchant';
import { activateService } from '@/lib/laripay/service-gate';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminSecret = process.env.LARIPAY_ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { shop: string; access_token: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { shop, access_token } = body;
  if (!shop || !access_token) {
    return NextResponse.json({ error: 'shop and access_token required' }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({ where: { domain: shop } });
  if (existing) {
    await prisma.shop.update({
      where: { domain: shop },
      data: { accessToken: access_token },
    });
  } else {
    await prisma.shop.create({
      data: { domain: shop, accessToken: access_token },
    });
  }

  const merchantId = await ensureLariPayMerchantForShop(shop);

  if (merchantId) {
    await activateService(merchantId, 'shopify', {
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priceGel: 0,
    }).catch(() => {});
  }

  const host = process.env.HOST || 'https://laripay.vercel.app';
  let webhookResult: { success: boolean; error?: string } = { success: false, error: 'not attempted' };
  try {
    webhookResult = await registerWebhook(
      shop,
      'ORDERS_CREATE',
      `${host}/api/shopify/webhooks`,
    );
  } catch (err) {
    webhookResult = { success: false, error: String(err) };
  }

  return NextResponse.json({
    success: true,
    shop,
    merchant_id: merchantId,
    webhook: webhookResult,
  });
}
