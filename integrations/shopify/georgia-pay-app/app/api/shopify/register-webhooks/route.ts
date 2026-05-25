import { NextRequest, NextResponse } from 'next/server';
import { registerWebhook } from '@/lib/shopify-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing ?shop= parameter' }, { status: 400 });
  }

  const host = process.env.HOST || 'https://laripay.vercel.app';
  const callbackUrl = `${host}/api/shopify/webhooks`;

  try {
    const result = await registerWebhook(shop, 'ORDERS_CREATE', callbackUrl);
    console.log(`[register-webhooks] ORDERS_CREATE for ${shop}:`, result);
    return NextResponse.json({ shop, topic: 'ORDERS_CREATE', callbackUrl, ...result });
  } catch (err) {
    console.error('[register-webhooks] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
