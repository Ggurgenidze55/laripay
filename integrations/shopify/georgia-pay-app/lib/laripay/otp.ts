import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { platformEnv } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';
import { sendOtpEmail, sendOtpSms } from './otp-delivery';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function otpSecret(): string {
  return (
    platformEnv('OTP_SECRET') ||
    platformEnv('PORTAL_SECRET') ||
    platformEnv('ADMIN_SECRET') ||
    'laripay-otp-dev-change-me'
  );
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

function hashOtpCode(code: string): string {
  return createHmac('sha256', otpSecret()).update(code.trim()).digest('hex');
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  const expected = hashOtpCode(code);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(codeHash));
  } catch {
    return false;
  }
}

async function recentOtpExists(params: {
  email?: string;
  phone?: string;
  channel: string;
  purpose: string;
  pendingId?: string;
  loginId?: string;
}): Promise<boolean> {
  const since = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const row = await prisma.authOtpChallenge.findFirst({
    where: {
      channel: params.channel,
      purpose: params.purpose,
      pendingId: params.pendingId ?? undefined,
      loginId: params.loginId ?? undefined,
      email: params.email ?? undefined,
      phone: params.phone ?? undefined,
      createdAt: { gte: since },
      verifiedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
  return Boolean(row);
}

export async function issueOtp(params: {
  channel: 'email' | 'phone';
  purpose: string;
  email?: string;
  phone?: string;
  userId?: string;
  pendingId?: string;
  loginId?: string;
}): Promise<{ sent: boolean }> {
  const targetEmail = params.email?.trim().toLowerCase();
  const targetPhone = params.phone;

  if (params.channel === 'email' && !targetEmail) {
    throw new Error('EMAIL_REQUIRED');
  }
  if (params.channel === 'phone' && !targetPhone) {
    throw new Error('PHONE_REQUIRED');
  }

  if (
    await recentOtpExists({
      email: targetEmail,
      phone: targetPhone,
      channel: params.channel,
      purpose: params.purpose,
      pendingId: params.pendingId,
      loginId: params.loginId,
    })
  ) {
    return { sent: false };
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (params.channel === 'email' && targetEmail) {
    await sendOtpEmail(targetEmail, code, params.purpose);
  } else if (params.channel === 'phone' && targetPhone) {
    await sendOtpSms(targetPhone, code, params.purpose);
  }

  await prisma.authOtpChallenge.create({
    data: {
      userId: params.userId,
      pendingId: params.pendingId,
      loginId: params.loginId,
      email: targetEmail,
      phone: targetPhone,
      channel: params.channel,
      purpose: params.purpose,
      codeHash,
      expiresAt,
    },
  });

  return { sent: true };
}

export async function verifyOtp(params: {
  channel: 'email' | 'phone';
  purpose: string;
  code: string;
  pendingId?: string;
  loginId?: string;
  email?: string;
  phone?: string;
}): Promise<boolean> {
  const challenge = await prisma.authOtpChallenge.findFirst({
    where: {
      channel: params.channel,
      purpose: params.purpose,
      pendingId: params.pendingId ?? undefined,
      loginId: params.loginId ?? undefined,
      email: params.email?.trim().toLowerCase() ?? undefined,
      phone: params.phone ?? undefined,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) return false;
  if (challenge.attempts >= MAX_ATTEMPTS) return false;

  const ok = verifyOtpCode(params.code, challenge.codeHash);
  await prisma.authOtpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: challenge.attempts + 1 },
  });

  if (!ok) return false;

  await prisma.authOtpChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });

  return true;
}
