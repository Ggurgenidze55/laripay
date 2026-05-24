import { NextRequest } from 'next/server';
import { platformEnv } from '@/lib/laripay-env';
import { startRegistrationPending } from '@/lib/laripay/auth-2fa';
import { registerUserWithMerchant } from '@/lib/laripay/register-user';
import { normalizePhone } from '@/lib/laripay/phone';
import { jsonWithMerchantSession } from '@/lib/laripay/session-response';
import { is2faRequired } from '@/lib/laripay/two-factor-config';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { mapOtpDeliveryError } from '@/lib/laripay/otp-errors';
import { isTransientDbError, transientDbMessage } from '@/lib/laripay/db-errors';
import { ensureDatabaseReady, withDbRetry } from '@/lib/laripay/with-db-retry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    return await handleRegister(request);
  } catch (err) {
    console.error('[auth/register]', err);
    return laripayError(err instanceof Error ? err.message : 'Registration failed', 500);
  }
}

async function handleRegister(request: NextRequest) {
  if (platformEnv('ALLOW_SIGNUP') !== '1') {
    return laripayError('Registration is disabled on this server', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || body.full_name || '').trim();
  const businessName = String(body.business_name || body.name || '').trim();
  const slug = body.slug ? String(body.slug).trim() : undefined;
  const phoneRaw = String(body.phone || '');
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const require2fa = is2faRequired();

  if (!email || !password || !businessName) {
    return laripayError('email, password and business name are required');
  }
  if (require2fa && !phone) {
    return laripayError('valid phone is required when 2FA is enabled');
  }
  if (password.length < 12) {
    return laripayError('Password must be at least 12 characters');
  }

  try {
    await ensureDatabaseReady();
  } catch (err) {
    if (isTransientDbError(err)) {
      return laripayError(transientDbMessage(), 503, 'database_unavailable');
    }
    throw err;
  }

  try {
    if (!require2fa) {
      const { user, merchant, secretKey } = await withDbRetry(() =>
        registerUserWithMerchant({
        email,
        password,
        name: name || businessName,
        businessName,
        slug,
        phone: phone || undefined,
        }),
      );
      return jsonWithMerchantSession(
        { ...user, merchant },
        {
          api_key: secretKey,
          message: 'Account created.',
        },
        201,
      );
    }

    const { pendingId } = await withDbRetry(() =>
      startRegistrationPending({
        email,
        password,
        name: name || businessName,
        businessName,
        phone: phone!,
        slug,
      }),
    );

    return laripayJson(
      {
        requires_2fa: true,
        pending_id: pendingId,
        next_step: 'verify_email',
        message: 'Verification code sent to your email.',
      },
      202,
    );
  } catch (err) {
    if (isTransientDbError(err)) {
      return laripayError(transientDbMessage(), 503, 'database_unavailable');
    }
    const code = err instanceof Error ? err.message : '';
    if (code === 'EMAIL_TAKEN') {
      return laripayError(
        'This email is already registered. Sign in or use another email.',
        409,
        'duplicate_email',
      );
    }
    const otpErr = mapOtpDeliveryError(err);
    if (otpErr) return laripayError(otpErr.message, otpErr.status);
    return laripayError(code || 'Registration failed', 422);
  }
}
