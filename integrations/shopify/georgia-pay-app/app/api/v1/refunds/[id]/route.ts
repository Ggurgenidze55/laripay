import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { serializeRefund } from '@/lib/laripay/refunds';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const refund = await prisma.paykaRefund.findFirst({
    where: { id: params.id, merchantId: auth.merchant.id },
  });

  if (!refund) {
    return laripayError('Refund not found', 404);
  }

  return laripayJson(serializeRefund(refund));
}
