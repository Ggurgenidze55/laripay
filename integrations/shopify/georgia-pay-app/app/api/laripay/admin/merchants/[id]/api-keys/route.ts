import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { generateSecretKey, hashApiKey } from '@/lib/laripay/crypto';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: params.id } });
  if (!merchant) {
    return laripayError('Merchant not found', 404);
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'live' ? 'live' : 'test';
  const secretKey = generateSecretKey(mode);

  await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyPrefix: secretKey.slice(0, 16),
      keyHash: hashApiKey(secretKey),
      mode,
      name: body.name ? String(body.name) : `admin-${mode}`,
    },
  });

  return laripayJson(
    {
      api_key: secretKey,
      mode,
      prefix: secretKey.slice(0, 16),
      message: 'Store securely — shown only once',
    },
    201,
  );
}
