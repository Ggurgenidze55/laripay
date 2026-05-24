import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { isGeorgianBankId } from '@/lib/georgian-banks/registry';
import { isIntegrationPlatformId, setMerchantIntegration } from '@/lib/laripay/integration-platform';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: auth.merchantId } });
  if (!merchant) return laripayError('Merchant not found', 404);

  return laripayJson({
    id: merchant.id,
    slug: merchant.slug,
    email: merchant.email,
    billing_mode: merchant.billingMode,
    default_provider: merchant.defaultProvider,
    bank_configured: {
      tbc: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
      bog: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
    },
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

  const data: Record<string, string | null> = {};
  if (typeof body.default_provider === 'string' && isGeorgianBankId(body.default_provider)) {
    data.defaultProvider = body.default_provider;
  }
  if (typeof body.tbc_client_id === 'string') data.tbcClientId = body.tbc_client_id || null;
  if (typeof body.tbc_client_secret === 'string') {
    data.tbcClientSecret = body.tbc_client_secret || null;
  }
  if (typeof body.tbc_api_key === 'string') data.tbcApiKey = body.tbc_api_key || null;
  if (typeof body.bog_public_key === 'string') data.bogPublicKey = body.bog_public_key || null;
  if (typeof body.bog_secret_key === 'string') data.bogSecretKey = body.bog_secret_key || null;
  if (typeof body.bog_callback_public_key === 'string') {
    data.bogCallbackPublicKey = body.bog_callback_public_key || null;
  }

  if (typeof body.integration_platform === 'string' && isIntegrationPlatformId(body.integration_platform)) {
    await setMerchantIntegration(
      auth.merchantId,
      body.integration_platform as IntegrationPlatformId,
      typeof body.integration_ref === 'string' ? body.integration_ref : null,
      { force: true },
    );
  } else if (typeof body.integration_ref === 'string') {
    data.integrationRef = body.integration_ref.trim() || null;
  }

  const hasPlatform =
    typeof body.integration_platform === 'string' && isIntegrationPlatformId(body.integration_platform);
  if (Object.keys(data).length === 0 && !hasPlatform) {
    return laripayError('No supported fields to update');
  }

  const merchant =
    Object.keys(data).length > 0
      ? await prisma.merchant.update({ where: { id: auth.merchantId }, data })
      : await prisma.merchant.findUnique({ where: { id: auth.merchantId } });
  if (!merchant) return laripayError('Merchant not found', 404);

  return laripayJson({
    id: merchant.id,
    slug: merchant.slug,
    default_provider: merchant.defaultProvider,
    bank_configured: {
      tbc: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
      bog: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
    },
  });
}
