import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyLoginChallenge, resendLoginOtp } from '@/lib/laripay/auth-2fa';
import { attachAdminCookie } from '@/lib/laripay/admin-session';
import { attachPortalCookie } from '@/lib/laripay/portal-session';
import { attachUserCookie } from '@/lib/laripay/user-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { mapOtpDeliveryError } from '@/lib/laripay/otp-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const challengeId = String(body.challenge_id || '').trim();
  const emailCode = String(body.email_code || body.emailCode || '').trim();
  const phoneCode = String(body.phone_code || body.phoneCode || '').trim();
  const channel = String(body.channel || '') as 'email' | 'phone';
  const resendOnly = body.resend === true;

  if (!challengeId) {
    return laripayError('challenge_id is required');
  }

  if (resendOnly) {
    if (!['email', 'phone'].includes(channel)) {
      return laripayError('channel (email|phone) required for resend');
    }
    try {
      const sent = await resendLoginOtp(challengeId, channel);
      return laripayJson({ resent: sent.sent, channel });
    } catch (err) {
      const otpErr = mapOtpDeliveryError(err);
      if (otpErr) return laripayError(otpErr.message, otpErr.status);
      return laripayError(err instanceof Error ? err.message : 'Resend failed', 400);
    }
  }

  if (!emailCode || !phoneCode) {
    return laripayError('email_code and phone_code are required');
  }

  try {
    const { userId, purpose } = await verifyLoginChallenge(challengeId, emailCode, phoneCode);
    const user = await prisma.platformUser.findUnique({
      where: { id: userId },
      include: { merchant: true },
    });
    if (!user) {
      return laripayError('User not found', 404);
    }

    if (purpose === 'admin_login') {
      if (user.role !== 'platform_admin') {
        return laripayError('Not a platform admin account', 403);
      }
      const res = laripayJson({
        ok: true,
        role: 'platform_admin',
        user: { id: user.id, email: user.email, name: user.name },
      });
      attachUserCookie(res, user.id, null);
      const withAdmin = attachAdminCookie(res, user.id);
      if (!withAdmin) {
        return laripayError('Admin session could not be created (LARIPAY_ADMIN_SECRET missing)', 503);
      }
      return withAdmin;
    }

    if (!user.merchantId || !user.merchant) {
      return laripayError('No merchant linked to this account', 403);
    }
    if (user.merchant.status === 'suspended') {
      return laripayError('Merchant account is suspended', 403);
    }

    const res = laripayJson({
      user: { id: user.id, email: user.email, name: user.name },
      merchant: { id: user.merchant.id, slug: user.merchant.slug },
    });
    attachUserCookie(res, user.id, user.merchantId);
    return attachPortalCookie(res, user.merchantId, user.merchant.slug);
  } catch (err) {
    const code = err instanceof Error ? err.message : '';
    if (code === 'EMAIL_CODE_INVALID' || code === 'PHONE_CODE_INVALID') {
      return laripayError('Invalid verification code', 401, 'authentication_error');
    }
    if (code === 'CHALLENGE_INVALID') {
      return laripayError('Login session expired. Sign in again.', 410);
    }
    return laripayError(code || 'Verification failed', 422);
  }
}
