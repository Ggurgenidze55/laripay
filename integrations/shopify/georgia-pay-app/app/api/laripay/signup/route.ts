import { platformEnv } from '@/lib/laripay-env';
import { NextRequest, NextResponse } from 'next/server';
import { createMerchant } from '@/lib/laripay/onboard';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { isGeorgianBankId } from '@/lib/georgian-banks/registry';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';

export const dynamic = 'force-dynamic';

/**
 * Public merchant signup when LARIPAY_ALLOW_SIGNUP=1
 */
export async function POST(request: NextRequest) {
  if (platformEnv('ALLOW_SIGNUP') !== '1') {
    return laripayError('Public signup disabled', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email) {
    return laripayError('name and email are required');
  }

  try {
    const { merchant, secretKey } = await createMerchant({
      name,
      email,
      slug: body.slug ? String(body.slug) : undefined,
      billingMode: 'COMMISSION',
      defaultProvider:
        typeof body.default_provider === 'string' && isGeorgianBankId(body.default_provider)
          ? (body.default_provider as GeorgianBankId)
          : 'tbc',
    });

    return laripayJson(
      {
        merchant: {
          id: merchant.id,
          slug: merchant.slug,
          billing_mode: merchant.billingMode,
        },
        api_key: secretKey,
        webhook_secret: merchant.webhookSecret,
        docs: '/LARIPAY-INTEGRATIONS.md',
      },
      201,
    );
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Signup failed';
    if (raw.includes('Unique constraint') && raw.includes('slug')) {
      return laripayError(
        'This shop slug is already taken. Choose another slug or sign in via the merchant console.',
        409,
        'duplicate_slug',
      );
    }
    if (raw.includes('Unique constraint') && raw.includes('email')) {
      return laripayError(
        'An account with this email already exists. Use the merchant console with your API key.',
        409,
        'duplicate_email',
      );
    }
    return laripayError(raw, 422);
  }
}
