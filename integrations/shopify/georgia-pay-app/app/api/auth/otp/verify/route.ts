import { NextRequest } from 'next/server';
import { markPendingChannelVerified, resendRegistrationOtp } from '@/lib/laripay/auth-2fa';
import { verifyOtp } from '@/lib/laripay/otp';
import { attachPortalCookie } from '@/lib/laripay/portal-session';
import { attachUserCookie } from '@/lib/laripay/user-session';
import prisma from '@/lib/prisma';
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

  const pendingId = String(body.pending_id || '').trim();
  const channel = String(body.channel || '') as 'email' | 'phone';
  const code = String(body.code || '').trim();
  const resendOnly = body.resend === true;

  if (!pendingId || !['email', 'phone'].includes(channel)) {
    return laripayError('pending_id and channel (email|phone) are required');
  }

  const pending = await prisma.authPendingRegistration.findUnique({ where: { id: pendingId } });
  if (!pending || pending.expiresAt < new Date()) {
    return laripayError('Registration session expired. Start again.', 410);
  }

  if (resendOnly) {
    try {
      const sent = await resendRegistrationOtp(pendingId, channel);
      return laripayJson({ resent: sent.sent, channel });
    } catch (err) {
      const otpErr = mapOtpDeliveryError(err);
      if (otpErr) return laripayError(otpErr.message, otpErr.status);
      const msg = err instanceof Error ? err.message : 'Resend failed';
      return laripayError(msg, 400);
    }
  }

  if (!code || code.length < 6) {
    return laripayError('Verification code is required');
  }

  const ok = await verifyOtp({
    channel,
    purpose: 'register',
    code,
    pendingId,
    email: channel === 'email' ? pending.email : undefined,
    phone: channel === 'phone' ? pending.phone : undefined,
  });

  if (!ok) {
    return laripayError('Invalid or expired verification code', 401);
  }

  try {
    const result = await markPendingChannelVerified(pendingId, channel);

    if (result.completed) {
      const { user, merchant, secretKey } = result.completed;
      const res = laripayJson(
        {
          user: { id: user.id, email: user.email, name: user.name },
          merchant: merchant
            ? { id: merchant.id, slug: merchant.slug }
            : null,
          api_key: secretKey,
          message: 'Account verified and created.',
        },
        201,
      );
      attachUserCookie(res, user.id, merchant?.id ?? null);
      if (merchant) {
        return attachPortalCookie(res, merchant.id, merchant.slug);
      }
      return res;
    }

    return laripayJson({
      pending_id: pendingId,
      email_verified: result.emailDone,
      phone_verified: result.phoneDone,
      next_step: result.emailDone && !result.phoneDone ? 'verify_phone' : 'verify_email',
      message:
        channel === 'email'
          ? 'Email verified. Code sent to your phone.'
          : 'Continue verification.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    return laripayError(msg, 422);
  }
}
