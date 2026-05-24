import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getMerchantIntegrationInfo, isIntegrationPlatformId, setMerchantIntegration } from '@/lib/laripay/integration-platform';
import { MERCHANT_INTEGRATION_CATALOG } from '@/lib/laripay/merchant-integration-catalog';
import { buildMerchantServices } from '@/lib/laripay/merchant-services';
import { getPublicApiBase } from '@/lib/laripay/public-api-base';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: auth.merchantId } });
  if (!merchant) return laripayError('Merchant not found', 404);

  const integration = await getMerchantIntegrationInfo(merchant.id);
  const apiKeys = await prisma.apiKey.findMany({
    where: { merchantId: merchant.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });
  const services = await buildMerchantServices(merchant);

  const bankConfigured = {
    tbc: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
    bog: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
  };

  const platforms = MERCHANT_INTEGRATION_CATALOG.map((entry) => {
    const active = integration.platform === entry.id;
    const hasTestKey = apiKeys.some((k) => k.mode === 'test');
    const hasLiveKey = apiKeys.some((k) => k.mode === 'live');
    const webhooksOn = webhooks.some((w) => w.enabled);
    let ready = true;
    if (entry.requiresApiKey) ready = ready && hasTestKey;
    if (entry.requiresBank) ready = ready && (bankConfigured.tbc || bankConfigured.bog);
    if (entry.id === 'shopify') {
      ready = ready && (active || integration.inferred);
    }
    return {
      id: entry.id,
      status: entry.status,
      active,
      ready,
      plugin_downloads: entry.pluginDownloads,
      docs_path: entry.docsPath,
    };
  });

  return laripayJson({
    api_base_url: getPublicApiBase(request),
    merchant: {
      slug: merchant.slug,
      integration: {
        platform: integration.platform,
        label: integration.label,
        ref: integration.ref,
        inferred: integration.inferred,
      },
      bank_configured: bankConfigured,
      default_provider: merchant.defaultProvider,
    },
    api_keys: apiKeys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      mode: k.mode,
      name: k.name,
      last_used_at: k.lastUsedAt,
    })),
    webhooks: webhooks.map((w) => ({
      id: w.id,
      url: w.url,
      enabled: w.enabled,
      events: w.events,
    })),
    services: services.map((s) => ({ id: s.id, enabled: s.enabled })),
    platforms,
    shopify_app_url: `${getPublicApiBase(request)}/laripay/en/integrations#shopify`,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const platform = body.integration_platform;
  const ref = body.integration_ref;

  if (typeof platform === 'string' && isIntegrationPlatformId(platform)) {
    await setMerchantIntegration(
      auth.merchantId,
      platform as IntegrationPlatformId,
      typeof ref === 'string' ? ref : null,
      { force: true },
    );
  } else if (typeof ref === 'string') {
    await prisma.merchant.update({
      where: { id: auth.merchantId },
      data: { integrationRef: ref.trim() || null },
    });
  } else {
    return laripayError('integration_platform or integration_ref required');
  }

  const integration = await getMerchantIntegrationInfo(auth.merchantId);
  return laripayJson({
    integration: {
      platform: integration.platform,
      label: integration.label,
      ref: integration.ref,
      inferred: integration.inferred,
    },
  });
}
