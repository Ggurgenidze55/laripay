import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { generateSecretKey, hashApiKey } from '@/lib/laripay/crypto';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'live' ? 'live' : 'test';
  const name = body.name ? String(body.name) : `${mode} key`;

  const secretKey = generateSecretKey(mode);
  const row = await prisma.apiKey.create({
    data: {
      merchantId: auth.merchantId,
      keyPrefix: secretKey.slice(0, 16),
      keyHash: hashApiKey(secretKey),
      mode,
      name,
    },
  });

  return laripayJson(
    {
      api_key: secretKey,
      id: row.id,
      prefix: row.keyPrefix,
      mode: row.mode,
      message: 'Copy now — shown only once',
    },
    201,
  );
}
