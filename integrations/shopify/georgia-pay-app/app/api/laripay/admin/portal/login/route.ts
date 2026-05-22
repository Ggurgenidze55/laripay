import { NextRequest } from 'next/server';
import { platformEnv } from '@/lib/laripay-env';
import { attachAdminCookie } from '@/lib/laripay/admin-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!platformEnv('ADMIN_SECRET')) {
    return laripayError(
      'LARIPAY_ADMIN_SECRET is not configured on this server',
      503,
      'configuration_error',
    );
  }

  const configured = platformEnv('ADMIN_SECRET')!;
  let secret = request.headers.get('x-laripay-admin-secret') || '';
  if (!secret) {
    try {
      const body = await request.json();
      secret = String(body.admin_secret || body.secret || '').trim();
    } catch {
      /* header-only login */
    }
  }

  if (!secret || secret !== configured) {
    return laripayError('Invalid admin secret', 401, 'authentication_error');
  }

  const res = laripayJson({ ok: true, role: 'platform_admin' });
  const withCookie = attachAdminCookie(res);
  if (!withCookie) {
    return laripayError('Could not create admin session', 500);
  }
  return withCookie;
}
