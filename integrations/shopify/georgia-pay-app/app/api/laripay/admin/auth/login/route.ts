import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { startLoginChallenge } from '@/lib/laripay/auth-2fa';
import { jsonWithAdminSession } from '@/lib/laripay/session-response';
import { is2faRequired } from '@/lib/laripay/two-factor-config';
import { verifyPassword } from '@/lib/laripay/user-auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { mapOtpDeliveryError } from '@/lib/laripay/otp-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return laripayError('Invalid JSON');
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return laripayError('email and password are required');
    }

    const user = await prisma.platformUser.findUnique({ where: { email } });
    if (!user || user.role !== 'platform_admin') {
      return laripayError('Invalid admin credentials', 401, 'authentication_error');
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return laripayError('Invalid admin credentials', 401, 'authentication_error');
    }

    if (!is2faRequired()) {
      try {
        return jsonWithAdminSession(user);
      } catch {
        return laripayError('Admin session could not be created (LARIPAY_ADMIN_SECRET missing)', 503);
      }
    }

    try {
      const challenge = await startLoginChallenge(user.id, 'admin_login');
      return laripayJson({
        requires_2fa: true,
        challenge_id: challenge.challengeId,
        email: challenge.email,
        phone_masked: challenge.phoneMasked,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'PHONE_NOT_CONFIGURED') {
        return laripayError('Admin phone not configured', 503);
      }
      const otpErr = mapOtpDeliveryError(err);
      if (otpErr) return laripayError(otpErr.message, otpErr.status);
      return laripayError('Could not start admin 2FA', 503);
    }
  } catch (err) {
    console.error('[admin/auth/login]', err);
    const message = err instanceof Error ? err.message : 'Admin login failed';
    if (/platformUser|does not exist|relation/i.test(message)) {
      return laripayError(
        'Database not migrated. Run prisma migrate deploy on production.',
        503,
        'configuration_error',
      );
    }
    return laripayError(message, 500, 'internal_error');
  }
}
