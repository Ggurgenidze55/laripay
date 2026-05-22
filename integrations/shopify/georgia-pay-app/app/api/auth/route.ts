import { NextRequest, NextResponse } from 'next/server';
import { shopify, saveShopSession } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  if (!sanitizedShop) {
    return NextResponse.json({ error: 'Invalid shop' }, { status: 400 });
  }

  const authRoute = await shopify.auth.begin({
    shop: sanitizedShop,
    callbackPath: '/api/auth/callback',
    isOnline: false,
    rawRequest: request,
    rawResponse: new NextResponse(),
  });

  return authRoute;
}
