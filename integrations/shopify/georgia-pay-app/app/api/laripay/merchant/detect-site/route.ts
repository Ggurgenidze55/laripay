import { NextRequest } from 'next/server';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { detectPlatform } from '@/lib/laripay/detect-platform';
import { setMerchantIntegration } from '@/lib/laripay/integration-platform';
import { activateService } from '@/lib/laripay/service-gate';
import type { ServiceId } from '@/lib/laripay/service-gate';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORM_TO_SERVICE: Partial<Record<IntegrationPlatformId, ServiceId>> = {
  shopify: 'shopify',
  woocommerce: 'woocommerce',
};

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatePortalRequest(request);
    if ('error' in auth) {
      return laripayError(auth.error, auth.status, 'authentication_error');
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return laripayError('Invalid JSON', 400);
    }

    const siteUrl = typeof body.site_url === 'string' ? body.site_url.trim() : '';
    if (!siteUrl) {
      return laripayError('site_url is required', 400);
    }

    const result = await detectPlatform(siteUrl);

    await setMerchantIntegration(
      auth.merchantId,
      result.platform,
      result.siteUrl,
      { force: true },
    );

    const serviceId = PLATFORM_TO_SERVICE[result.platform];
    if (serviceId) {
      await activateService(auth.merchantId, serviceId, {
        paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priceGel: 0,
      }).catch((err) => {
        console.warn(`[detect-site] Service activation failed for ${serviceId}:`, err);
      });
    }

    return laripayJson({
      detection: {
        platform: result.platform,
        confidence: result.confidence,
        signals: result.signals,
        site_url: result.siteUrl,
      },
    });
  } catch (err) {
    console.error('[detect-site]', err);
    return laripayError('Detection failed', 500);
  }
}
