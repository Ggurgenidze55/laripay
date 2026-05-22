import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOrError } from '@/lib/laripay/auth';
import { generateSecretKey, hashApiKey } from '@/lib/laripay/crypto';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { resolveMerchantId } from '@/lib/laripay/resolve-merchant';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminErr = requireAdminOrError(request);
  if (adminErr) return adminErr;

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'live' ? 'live' : 'test';

  const merchantId = await resolveMerchantId(params.id);
  if (!merchantId) return laripayError('Merchant not found', 404);

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) return laripayError('Merchant not found', 404);

  const secretKey = generateSecretKey(mode);
  await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyPrefix: secretKey.slice(0, 16),
      keyHash: hashApiKey(secretKey),
      mode,
      name: body.name ? String(body.name) : `${mode} key`,
    },
  });

  return laripayJson(
    {
      api_key: secretKey,
      mode,
      message: 'Store securely — shown only once',
    },
    201,
  );
}
