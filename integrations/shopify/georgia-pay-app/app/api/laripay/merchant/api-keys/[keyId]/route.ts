import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } },
) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const key = await prisma.apiKey.findFirst({
    where: { id: params.keyId, merchantId: auth.merchantId, revokedAt: null },
  });
  if (!key) {
    return laripayError('API key not found', 404);
  }

  await prisma.apiKey.update({
    where: { id: params.keyId },
    data: { revokedAt: new Date() },
  });

  return laripayJson({ id: params.keyId, revoked: true });
}
