import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  if (!apiKey || !apiSecret || apiKey === 'build-placeholder') {
    return NextResponse.json(
      {
        error:
          'Shopify app credentials missing. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET on Vercel.',
      },
      { status: 503 },
    );
  }

  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  if (!sanitizedShop) {
    return NextResponse.json({ error: 'Invalid shop' }, { status: 400 });
  }

  try {
    return await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: '/api/auth/callback',
      isOnline: false,
      rawRequest: request,
    });
  } catch (err) {
    console.error('[api/auth]', err);
    const message = err instanceof Error ? err.message : 'OAuth failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
