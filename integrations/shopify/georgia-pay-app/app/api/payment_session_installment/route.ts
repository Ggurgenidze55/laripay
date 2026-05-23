import { startShopifyInstallmentCheckout } from '@/lib/laripay/shopify-installment-checkout';
import type { ShopifyPaymentSessionBody } from '@/lib/payment-service';

export { type ShopifyPaymentSessionBody };

/**
 * Shopify Payments App — installment payment session (bank-hosted pay-in-parts).
 */
export async function POST(request: Request) {
  const shopDomain = request.headers.get('shopify-shop-domain');
  const requestId = request.headers.get('shopify-request-id');

  if (!shopDomain) {
    return Response.json({ error: 'Missing Shopify-Shop-Domain header' }, { status: 400 });
  }

  let body: ShopifyPaymentSessionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id || !body.gid || !body.amount || !body.currency) {
    return Response.json({ error: 'Invalid payment session payload' }, { status: 400 });
  }

  try {
    const { redirect_url } = await startShopifyInstallmentCheckout(body, shopDomain);
    const response = Response.json({ redirect_url }, { status: 200 });
    if (requestId) response.headers.set('Shopify-Request-Id', requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Installment payment session failed';
    console.error('[payment_session_installment]', message);
    return Response.json({ error: message }, { status: 422 });
  }
}
