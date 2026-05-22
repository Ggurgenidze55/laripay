import { NextResponse } from 'next/server';
import { attachAdminCookie } from './admin-session';
import { attachPortalCookie } from './portal-session';
import { attachUserCookie } from './user-session';
import { laripayJson } from './api-response';

type MerchantUser = {
  id: string;
  email: string;
  name: string | null;
  merchantId: string | null;
  merchant: { id: string; slug: string; status?: string } | null;
};

export function jsonWithMerchantSession(
  user: MerchantUser,
  extra?: Record<string, unknown>,
  status = 200,
): NextResponse {
  if (!user.merchantId || !user.merchant) {
    throw new Error('NO_MERCHANT');
  }
  const res = laripayJson(
    {
      requires_2fa: false,
      user: { id: user.id, email: user.email, name: user.name },
      merchant: { id: user.merchant.id, slug: user.merchant.slug },
      ...extra,
    },
    status,
  );
  attachUserCookie(res, user.id, user.merchantId);
  return attachPortalCookie(res, user.merchantId, user.merchant.slug);
}

export function jsonWithAdminSession(
  user: { id: string; email: string; name: string | null },
  extra?: Record<string, unknown>,
): NextResponse {
  const res = laripayJson({
    requires_2fa: false,
    ok: true,
    role: 'platform_admin',
    user: { id: user.id, email: user.email, name: user.name },
    ...extra,
  });
  attachUserCookie(res, user.id, null);
  const withAdmin = attachAdminCookie(res, user.id);
  if (!withAdmin) {
    throw new Error('ADMIN_SESSION_FAILED');
  }
  return withAdmin;
}
