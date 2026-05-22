import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

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
  if (body.default_provider === 'tbc' || body.default_provider === 'bog') {
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

  if (Object.keys(data).length === 0) {
    return laripayError('No supported fields to update');
  }

  const merchant = await prisma.merchant.update({
    where: { id: auth.merchantId },
    data,
  });

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
