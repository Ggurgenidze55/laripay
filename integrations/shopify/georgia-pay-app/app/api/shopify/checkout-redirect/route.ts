import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMerchantForShop } from '@/lib/laripay/provision-merchant';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('order_id');
  const shop = request.nextUrl.searchParams.get('shop');

  if (!orderId || !shop) {
    return NextResponse.json({ error: 'order_id and shop required' }, { status: 400 });
  }

  const refId = `shopify_order_${orderId}`;
  const merchant = await getMerchantForShop(shop);

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found for shop' }, { status: 404 });
  }

  const session = await prisma.checkoutSession.findFirst({
    where: {
      merchantId: merchant.id,
      clientReferenceId: refId,
      status: { in: ['open', 'complete'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!session || !session.redirectUrl) {
    return NextResponse.json({
      error: 'No active payment session for this order',
      order_id: orderId,
      status: 'not_found',
    }, { status: 404 });
  }

  if (session.status === 'complete') {
    return NextResponse.json({
      status: 'already_paid',
      order_id: orderId,
    });
  }

  return NextResponse.redirect(session.redirectUrl);
}
