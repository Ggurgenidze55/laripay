import prisma from '@/lib/prisma';
import { createMerchant } from './onboard';
import { hashPassword, uniqueSlug } from './user-auth';

export type RegisterUserInput = {
  email: string;
  password: string;
  name: string;
  businessName: string;
  slug?: string;
  phone?: string;
  passwordHash?: string;
  skipPasswordHash?: boolean;
  role?: string;
};

export async function registerUserWithMerchant(input: RegisterUserInput) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await prisma.platformUser.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('EMAIL_TAKEN');
  }

  const existingMerchant = await prisma.merchant.findUnique({ where: { email } });
  if (existingMerchant && input.role !== 'platform_admin') {
    throw new Error('EMAIL_TAKEN');
  }

  let slug = input.slug?.trim() || uniqueSlug(input.businessName);
  const slugTaken = await prisma.merchant.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = uniqueSlug(input.businessName);
  }

  const passwordHash =
    input.skipPasswordHash && input.passwordHash
      ? input.passwordHash
      : await hashPassword(input.password);

  const isAdmin = input.role === 'platform_admin';
  let merchant = null as Awaited<ReturnType<typeof createMerchant>>['merchant'] | null;
  let secretKey: string | null = null;

  if (!isAdmin) {
    const created = await createMerchant({
      name: input.businessName.trim(),
      email,
      slug,
      billingMode: 'COMMISSION',
    });
    merchant = created.merchant;
    secretKey = created.secretKey;
  }

  const now = new Date();
  const user = await prisma.platformUser.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      phone: input.phone || null,
      phoneVerifiedAt: input.phone ? now : null,
      emailVerifiedAt: now,
      role: input.role || 'merchant',
      merchantId: merchant?.id ?? null,
    },
  });

  return { user, merchant, secretKey };
}
