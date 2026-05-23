import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; keyId: string } },
) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  const key = await prisma.apiKey.findFirst({
    where: { id: params.keyId, merchantId: params.id },
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
