import { clearAdminCookie } from '@/lib/laripay/admin-session';
import { laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST() {
  return clearAdminCookie(laripayJson({ ok: true }));
}
