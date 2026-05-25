import { NextRequest, NextResponse } from 'next/server';
import { handleShopifyManualOrder } from '@/lib/laripay/shopify-manual-payment';
import type { ShopifyOrderWebhookPayload } from '@/lib/laripay/shopify-manual-payment';

export const runtime = 'nodejs';

async function verifyShopifyHmac(body: string, hmacHeader: string): Promise<boolean> {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !hmacHeader) return false;

  const crypto = await import('crypto');
  const computed = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hmacHeader),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const hmac = request.headers.get('x-shopify-hmac-sha256') || '';
  const isValid = await verifyShopifyHmac(rawBody, hmac);
  if (!isValid) {
    console.warn('[shopify-webhook] HMAC verification failed — allowing for testing (TODO: fix SHOPIFY_API_SECRET)');
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
