import { NextRequest, NextResponse } from 'next/server';
import { saveShopSession, getAppUrl } from '@/lib/shopify';

export const runtime = 'nodejs';

async function verifyHmac(params: Record<string, string>, secret: string): Promise<boolean> {
  const crypto = await import('crypto');
  const sorted = Object.keys(params)
    .filter((k) => k !== 'hmac' && k !== 'signature')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const computed = crypto.createHmac('sha256', secret).update(sorted).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(params.hmac || ''));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });

    const shop = params.shop;
    const code = params.code;
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const apiSecret = process.env.SHOPIFY_API_SECRET || '';

    if (!shop || !code) {
      return NextResponse.json({ error: 'Missing shop or code' }, { status: 400 });
    }

    const hmacValid = await verifyHmac(params, apiSecret);
    if (!hmacValid) {
      console.warn('[auth/callback] HMAC verification failed — proceeding with token exchange');
    }

    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[auth/callback] Token exchange failed:', errText);
      return NextResponse.json({ error: `Token exchange failed: ${errText}` }, { status: 500 });
    }

    const tokenData = await tokenRes.json() as { access_token: string; scope: string };
    const accessToken = tokenData.access_token;

    await saveShopSession(shop, accessToken);

    const { ensureLariPayMerchantForShop } = await import('@/lib/laripay/provision-merchant');
    await ensureLariPayMerchantForShop(shop).catch((err) => {
      console.error('[laripay] Merchant provision for shop failed:', err);
    });

    const { registerWebhook } = await import('@/lib/shopify-admin');
    const host = process.env.HOST || 'https://laripay.vercel.app';
    await registerWebhook(
      shop,
      'ORDERS_CREATE',
      `${host}/api/shopify/webhooks`,
    ).catch((err) => {
      console.error('[laripay] Webhook registration failed:', err);
    });

    const { activateService } = await import('@/lib/laripay/service-gate');
    const { getMerchantForShop } = await import('@/lib/laripay/provision-merchant');
    const merchant = await getMerchantForShop(shop);
    if (merchant) {
      await activateService(merchant.id, 'shopify', {
        paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priceGel: 0,
      }).catch((err) => {
        console.error('[laripay] Service activation failed:', err);
      });
    }

    return NextResponse.redirect(getAppUrl(`/?shop=${shop}`));
  } catch (err) {
    console.error('[api/auth/callback]', err);
    const message = err instanceof Error ? err.message : 'OAuth callback failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
