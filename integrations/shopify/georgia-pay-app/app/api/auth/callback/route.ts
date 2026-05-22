import { NextRequest, NextResponse } from 'next/server';
import { shopify, saveShopSession, getAppUrl } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const callback = await shopify.auth.callback({
    rawRequest: request,
    rawResponse: response,
  });

  const { session } = callback;
  await saveShopSession(session.shop, session.accessToken || '');

  const { ensureLariPayMerchantForShop } = await import('@/lib/laripay/provision-merchant');
  await ensureLariPayMerchantForShop(session.shop).catch((err) => {
    console.error('[laripay] Merchant provision for shop failed:', err);
  });

  const redirect = NextResponse.redirect(getAppUrl(`/?shop=${session.shop}`));
  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value, cookie);
  });

  return redirect;
}
