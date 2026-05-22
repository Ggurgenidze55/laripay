import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { getCheckoutSessionForMerchant } from '@/lib/laripay/checkout';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const session = await getCheckoutSessionForMerchant(auth.merchant.id, params.id);
  if (!session) {
    return laripayError('Checkout session not found', 404, 'resource_missing');
  }

  return laripayJson(session);
}
