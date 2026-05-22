import { NextRequest, NextResponse } from 'next/server';
import { startCheckoutRedirect, type ShopifyPaymentSessionBody } from '@/lib/payment-service';

/**
 * Shopify Payments App — offsite payment session start.
 * POST from Shopify with payment session payload; respond with redirect_url.
 */
export async function POST(request: NextRequest) {
  const shopDomain = request.headers.get('shopify-shop-domain');
  const requestId = request.headers.get('shopify-request-id');

  if (!shopDomain) {
    return NextResponse.json({ error: 'Missing Shopify-Shop-Domain header' }, { status: 400 });
  }

  let body: ShopifyPaymentSessionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id || !body.gid || !body.amount || !body.currency) {
    return NextResponse.json({ error: 'Invalid payment session payload' }, { status: 400 });
  }

  try {
    const { redirect_url } = await startCheckoutRedirect(body, shopDomain);

    const response = NextResponse.json({ redirect_url }, { status: 200 });
    if (requestId) response.headers.set('Shopify-Request-Id', requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment session failed';
    console.error('[payment_session]', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
