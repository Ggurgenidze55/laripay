import { clearPortalCookie } from '@/lib/laripay/portal-session';
import { clearUserCookie } from '@/lib/laripay/user-session';
import { laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = laripayJson({ ok: true });
  clearUserCookie(res);
  return clearPortalCookie(res);
}
