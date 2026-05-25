import { NextRequest, NextResponse } from 'next/server';
import { shopify, saveShopSession, getAppUrl } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: request,
    });

    const { session, headers } = callback;
    await saveShopSession(session.shop, session.accessToken || '');

    const { ensureLariPayMerchantForShop } = await import('@/lib/laripay/provision-merchant');
    await ensureLariPayMerchantForShop(session.shop).catch((err) => {
      console.error('[laripay] Merchant provision for shop failed:', err);
    });

    const { registerWebhook } = await import('@/lib/shopify-admin');
    const host = process.env.HOST || 'https://laripay.vercel.app';
    await registerWebhook(
      session.shop,
      'ORDERS_CREATE',
      `${host}/api/shopify/webhooks`,
    ).catch((err) => {
      console.error('[laripay] Webhook registration failed:', err);
    });

    const { activateService } = await import('@/lib/laripay/service-gate');
    const { getMerchantForShop } = await import('@/lib/laripay/provision-merchant');
    const merchant = await getMerchantForShop(session.shop);
    if (merchant) {
      await activateService(merchant.id, 'shopify', {
        paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priceGel: 0,
      }).catch((err) => {
        console.error('[laripay] Service activation failed:', err);
      });
    }

    const redirect = NextResponse.redirect(getAppUrl(`/?shop=${session.shop}`));
    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => redirect.headers.set(key, value));
      } else if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
          redirect.headers.set(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string') redirect.headers.set(key, value);
        }
      }
    }

    return redirect;
  } catch (err) {
    console.error('[api/auth/callback]', err);
    const message = err instanceof Error ? err.message : 'OAuth callback failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
