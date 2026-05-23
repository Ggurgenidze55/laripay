import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { platformEnv } from '@/lib/laripay-env';
import { hashApiKey } from './crypto';
import { laripayError } from './api-response';
import { recordIntegrationFromRequest } from './integration-platform';

export interface AuthenticatedMerchant {
  id: string;
  slug: string;
  email: string;
  billingMode: string;
  commissionRateBps: number;
  subscriptionActiveUntil: Date | null;
  defaultProvider: string;
  webhookSecret: string;
}

export async function authenticateApiRequest(
  request: NextRequest,
): Promise<{ merchant: AuthenticatedMerchant } | { error: string; status: number }> {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerKey =
    request.headers.get('x-laripay-api-key') ||
    request.headers.get('x-payka-api-key') ||
    '';
  const fullKey = bearer || headerKey;

  if (!fullKey || (!fullKey.startsWith('sk_test_') && !fullKey.startsWith('sk_live_'))) {
    return { error: 'Missing or invalid API key. Use Authorization: Bearer sk_test_...', status: 401 };
  }

  const keyHash = hashApiKey(fullKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { merchant: true },
  });

  if (!apiKey || apiKey.revokedAt) {
    return { error: 'Invalid API key', status: 401 };
  }

  if (apiKey.merchant.status !== 'active') {
    return { error: 'Merchant account suspended', status: 403 };
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  await recordIntegrationFromRequest(apiKey.merchantId, request).catch(() => {});

  const m = apiKey.merchant;
  return {
    merchant: {
      id: m.id,
      slug: m.slug,
      email: m.email,
      billingMode: m.billingMode,
      commissionRateBps: m.commissionRateBps,
      subscriptionActiveUntil: m.subscriptionActiveUntil,
      defaultProvider: m.defaultProvider,
      webhookSecret: m.webhookSecret,
    },
  };
}

export function requireAdminSecret(request: NextRequest): boolean {
  const secret = platformEnv('ADMIN_SECRET');
  if (!secret) return false;
  const provided =
    request.headers.get('x-laripay-admin-secret') ||
    request.headers.get('x-payka-admin-secret') ||
    request.nextUrl.searchParams.get('admin_secret') ||
    '';
  return provided === secret;
}

/** Returns error response or null when admin auth succeeded. */
export function requireAdminOrError(request: NextRequest): NextResponse | null {
  if (!platformEnv('ADMIN_SECRET')) {
    return laripayError(
      'LARIPAY_ADMIN_SECRET (or PAYKA_ADMIN_SECRET) is not configured on this server',
      503,
      'configuration_error',
    );
  }
  if (!requireAdminSecret(request)) {
    return laripayError('Invalid or missing admin secret', 401, 'authentication_error');
  }
  return null;
}
