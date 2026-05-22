import prisma from '@/lib/prisma';
import { issueOtp } from './otp';
import { registerUserWithMerchant } from './register-user';
import { hashPassword } from './user-auth';

const PENDING_TTL_MS = 30 * 60 * 1000;
const LOGIN_CHALLENGE_TTL_MS = 15 * 60 * 1000;

export async function startRegistrationPending(input: {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone: string;
  slug?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await prisma.platformUser.findUnique({ where: { email } });
  if (existingUser) throw new Error('EMAIL_TAKEN');

  const existingMerchant = await prisma.merchant.findUnique({ where: { email } });
  if (existingMerchant) throw new Error('EMAIL_TAKEN');

  const passwordHash = await hashPassword(input.password);
  const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

  await prisma.authPendingRegistration.deleteMany({ where: { email } });

  const pending = await prisma.authPendingRegistration.create({
    data: {
      email,
      phone: input.phone,
      passwordHash,
      name: input.name.trim(),
      businessName: input.businessName.trim(),
      slug: input.slug?.trim() || null,
      expiresAt,
    },
  });

  await issueOtp({
    channel: 'email',
    purpose: 'register',
    email,
    pendingId: pending.id,
  });

  return { pendingId: pending.id };
}

export async function markPendingChannelVerified(
  pendingId: string,
  channel: 'email' | 'phone',
): Promise<{ emailDone: boolean; phoneDone: boolean; completed?: Awaited<ReturnType<typeof registerUserWithMerchant>> }> {
  const pending = await prisma.authPendingRegistration.findUnique({ where: { id: pendingId } });
  if (!pending || pending.expiresAt < new Date()) {
    throw new Error('PENDING_EXPIRED');
  }

  const now = new Date();
  if (channel === 'email') {
    await prisma.authPendingRegistration.update({
      where: { id: pendingId },
      data: { emailVerifiedAt: now },
    });
    await issueOtp({
      channel: 'phone',
      purpose: 'register',
      phone: pending.phone,
      pendingId,
    });
  } else {
    await prisma.authPendingRegistration.update({
      where: { id: pendingId },
      data: { phoneVerifiedAt: now },
    });
  }

  const updated = await prisma.authPendingRegistration.findUnique({ where: { id: pendingId } });
  if (!updated) throw new Error('PENDING_NOT_FOUND');

  const emailDone = Boolean(updated.emailVerifiedAt);
  const phoneDone = Boolean(updated.phoneVerifiedAt);

  if (emailDone && phoneDone) {
    const result = await registerUserWithMerchant({
      email: updated.email,
      password: '',
      name: updated.name,
      businessName: updated.businessName,
      slug: updated.slug || undefined,
      phone: updated.phone,
      passwordHash: updated.passwordHash,
      skipPasswordHash: true,
    });
    await prisma.authPendingRegistration.delete({ where: { id: pendingId } });
    return { emailDone, phoneDone, completed: result };
  }

  return { emailDone, phoneDone };
}

export async function startLoginChallenge(userId: string, purpose: 'login' | 'admin_login') {
  const user = await prisma.platformUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');
  if (!user.phone || !user.phoneVerifiedAt) {
    throw new Error('PHONE_NOT_CONFIGURED');
  }

  const expiresAt = new Date(Date.now() + LOGIN_CHALLENGE_TTL_MS);
  const challenge = await prisma.authLoginChallenge.create({
    data: { userId, purpose, expiresAt },
  });

  await issueOtp({
    channel: 'email',
    purpose,
    email: user.email,
    userId: user.id,
    loginId: challenge.id,
  });
  await issueOtp({
    channel: 'phone',
    purpose,
    phone: user.phone,
    userId: user.id,
    loginId: challenge.id,
  });

  return { challengeId: challenge.id, email: user.email, phoneMasked: maskPhone(user.phone) };
}

export async function verifyLoginChallenge(
  challengeId: string,
  emailCode: string,
  phoneCode: string,
): Promise<{ userId: string; purpose: string }> {
  const challenge = await prisma.authLoginChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });
  if (!challenge || challenge.expiresAt < new Date() || challenge.completedAt) {
    throw new Error('CHALLENGE_INVALID');
  }

  const user = challenge.user;
  if (!user.phone) throw new Error('PHONE_NOT_CONFIGURED');

  const { verifyOtp } = await import('./otp');
  const emailOk = await verifyOtp({
    channel: 'email',
    purpose: challenge.purpose,
    code: emailCode,
    loginId: challengeId,
    email: user.email,
  });
  if (!emailOk) throw new Error('EMAIL_CODE_INVALID');

  const phoneOk = await verifyOtp({
    channel: 'phone',
    purpose: challenge.purpose,
    code: phoneCode,
    loginId: challengeId,
    phone: user.phone,
  });
  if (!phoneOk) throw new Error('PHONE_CODE_INVALID');

  const now = new Date();
  await prisma.authLoginChallenge.update({
    where: { id: challengeId },
    data: {
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      completedAt: now,
    },
  });

  await prisma.platformUser.update({
    where: { id: user.id },
    data: { emailVerifiedAt: now, phoneVerifiedAt: now },
  });

  return { userId: user.id, purpose: challenge.purpose };
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

export async function resendRegistrationOtp(pendingId: string, channel: 'email' | 'phone') {
  const pending = await prisma.authPendingRegistration.findUnique({ where: { id: pendingId } });
  if (!pending || pending.expiresAt < new Date()) throw new Error('PENDING_EXPIRED');

  if (channel === 'email') {
    return issueOtp({
      channel: 'email',
      purpose: 'register',
      email: pending.email,
      pendingId,
    });
  }
  if (!pending.emailVerifiedAt) throw new Error('VERIFY_EMAIL_FIRST');
  return issueOtp({
    channel: 'phone',
    purpose: 'register',
    phone: pending.phone,
    pendingId,
  });
}

export async function resendLoginOtp(challengeId: string, channel: 'email' | 'phone') {
  const challenge = await prisma.authLoginChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });
  if (!challenge || challenge.expiresAt < new Date() || challenge.completedAt) {
    throw new Error('CHALLENGE_INVALID');
  }
  const user = challenge.user;
  if (channel === 'email') {
    return issueOtp({
      channel: 'email',
      purpose: challenge.purpose,
      email: user.email,
      loginId: challengeId,
      userId: user.id,
    });
  }
  if (!user.phone) throw new Error('PHONE_NOT_CONFIGURED');
  return issueOtp({
    channel: 'phone',
    purpose: challenge.purpose,
    phone: user.phone,
    loginId: challengeId,
    userId: user.id,
  });
}
