import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { attachPortalCookie } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const res = laripayJson({
    merchant: {
      id: auth.merchant.id,
      slug: auth.merchant.slug,
      email: auth.merchant.email,
    },
    message: 'Portal session created — open LariPay.ai dashboard at /laripay/dashboard',
  });

  return attachPortalCookie(res, auth.merchant.id, auth.merchant.slug);
}
