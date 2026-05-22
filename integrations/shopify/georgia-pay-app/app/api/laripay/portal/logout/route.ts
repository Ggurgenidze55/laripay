import { clearPortalCookie } from '@/lib/laripay/portal-session';
import { laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST() {
  return clearPortalCookie(laripayJson({ ok: true }));
}
