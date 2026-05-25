import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { registerWebhook } from '@/lib/shopify-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'shop param required' }, { status: 400 });
  }

  const shopRecord = await prisma.shop.findUnique({ where: { domain: shop } });
  if (!shopRecord) {
    return NextResponse.json({ error: `Shop ${shop} not found in DB` }, { status: 404 });
  }

  const host = process.env.HOST || 'https://laripay.vercel.app';
  let result: { success: boolean; error?: string } = { success: false, error: 'not attempted' };
  try {
    result = await registerWebhook(shop, 'ORDERS_CREATE', `${host}/api/shopify/webhooks`);
  } catch (err) {
    result = { success: false, error: String(err) };
  }

  return NextResponse.json({ shop, webhook: result });
}
