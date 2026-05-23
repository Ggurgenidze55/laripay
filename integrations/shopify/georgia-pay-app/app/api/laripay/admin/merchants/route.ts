import { NextRequest } from 'next/server';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { listAdminMerchants, listAdminUsers } from '@/lib/laripay/admin-merchants';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  const includeUsers = request.nextUrl.searchParams.get('users') === '1';

  return laripayJson({
    merchants: await listAdminMerchants(),
    ...(includeUsers ? { users: await listAdminUsers() } : {}),
  });
}
