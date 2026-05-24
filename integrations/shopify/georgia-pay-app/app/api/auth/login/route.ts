import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { startLoginChallenge } from '@/lib/laripay/auth-2fa';
import { jsonWithMerchantSession } from '@/lib/laripay/session-response';
import { is2faRequired } from '@/lib/laripay/two-factor-config';
import { verifyPassword } from '@/lib/laripay/user-auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { mapOtpDeliveryError } from '@/lib/laripay/otp-errors';
import {
  databaseMisconfiguredUserMessage,
  isTransientDbError,
  transientDbMessage,
} from '@/lib/laripay/db-errors';
import { databaseMisconfiguredMessage } from '@/lib/laripay/db-config';
import { withDbRetry } from '@/lib/laripay/with-db-retry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    return await handleLogin(request);
  } catch (err) {
    console.error('[auth/login]', err);
    if (isTransientDbError(err)) {
      return laripayError(transientDbMessage(), 503, 'database_unavailable');
    }
    return laripayError(err instanceof Error ? err.message : 'Login failed', 500);
  }
}

async function handleLogin(request: NextRequest) {
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

  const misconfigured = databaseMisconfiguredMessage();
  if (misconfigured) {
    return laripayError(databaseMisconfiguredUserMessage(misconfigured), 503, 'database_misconfigured');
  }

  try {
    return await withDbRetry(
      async () => {
        const user = await prisma.platformUser.findUnique({
          where: { email },
          include: { merchant: true },
        });

        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return laripayError('Invalid email or password', 401, 'authentication_error');
        }

        if (user.role === 'platform_admin') {
          return laripayError('Use the platform admin sign-in page', 403);
        }

        if (!user.merchantId || !user.merchant) {
          return laripayError('No merchant linked to this account', 403);
        }

        if (user.merchant.status === 'suspended') {
          return laripayError('Merchant account is suspended', 403);
        }

        if (!is2faRequired()) {
          return jsonWithMerchantSession(user);
        }

        const challenge = await startLoginChallenge(user.id, 'login');
        return laripayJson({
          requires_2fa: true,
          challenge_id: challenge.challengeId,
          email: challenge.email,
          phone_masked: challenge.phoneMasked,
          message: 'Verification codes sent to your email and phone.',
        });
      },
      { attempts: 3, delayMs: 1000 },
    );
  } catch (err) {
    if (isTransientDbError(err)) {
      return laripayError(transientDbMessage(), 503, 'database_unavailable');
    }
    const code = err instanceof Error ? err.message : '';
    if (code === 'PHONE_NOT_CONFIGURED') {
      return laripayError('Account phone not configured. Contact support.', 403);
    }
    const otpErr = mapOtpDeliveryError(err);
    if (otpErr) return laripayError(otpErr.message, otpErr.status);
    return laripayError('Could not start 2FA login', 503);
  }
}
