import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { handleShopifyManualOrder } from '@/lib/laripay/shopify-manual-payment';
import type { ShopifyOrderWebhookPayload } from '@/lib/laripay/shopify-manual-payment';

function verifyShopifyHmac(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const computed = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(hmacHeader),
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const hmac = request.headers.get('x-shopify-hmac-sha256') || '';
  if (!verifyShopifyHmac(rawBody, hmac)) {
    console.error('[shopify-webhook] HMAC verification failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topic = request.headers.get('x-shopify-topic') || '';
  const shopDomain = request.headers.get('x-shopify-shop-domain') || '';

  console.log(`[shopify-webhook] ${topic} from ${shopDomain}`);

  if (topic === 'orders/create') {
    try {
      const order: ShopifyOrderWebhookPayload = JSON.parse(rawBody);
      const result = await handleShopifyManualOrder(shopDomain, order);

      if (result.handled) {
        return NextResponse.json({
          ok: true,
          session_id: result.sessionId,
          payment_url: result.paymentUrl,
        });
      }

      return NextResponse.json({ ok: true, skipped: true, reason: 'not_laripay_gateway' });
    } catch (err) {
      console.error('[shopify-webhook] orders/create handler error:', err);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, topic, message: 'unhandled topic' });
}
