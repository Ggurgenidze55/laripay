/**
 * Creates or updates the platform admin user (email + phone + strong password).
 * Credentials are written once to prisma/.admin-credentials.json (gitignored).
 *
 * Usage:
 *   LARIPAY_ADMIN_PHONE=+9955XXXXXXXX npm run seed:admin
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'gurgenidze55@gmail.com';
const ADMIN_NAME = 'Platform Admin';

function generatePassword() {
  return `${randomBytes(32).toString('base64url')}${randomBytes(32).toString('hex')}!Aa1`;
}

async function main() {
  const phone = process.env.LARIPAY_ADMIN_PHONE?.trim();
  if (!phone || !phone.startsWith('+')) {
    console.error('Set LARIPAY_ADMIN_PHONE in E.164 format, e.g. LARIPAY_ADMIN_PHONE=+995555123456');
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  const existing = await prisma.platformUser.findUnique({ where: { email: ADMIN_EMAIL } });
  let user;

  if (existing) {
    user = await prisma.platformUser.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        name: ADMIN_NAME,
        phone,
        phoneVerifiedAt: now,
        emailVerifiedAt: now,
        role: 'platform_admin',
        twoFactorRequired: true,
        merchantId: null,
      },
    });
    console.log('Updated existing admin user:', user.id);
  } else {
    user = await prisma.platformUser.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        phone,
        phoneVerifiedAt: now,
        emailVerifiedAt: now,
        role: 'platform_admin',
        twoFactorRequired: true,
        merchantId: null,
      },
    });
    console.log('Created admin user:', user.id);
  }

  const credPath = join(root, 'prisma', '.admin-credentials.json');
  mkdirSync(dirname(credPath), { recursive: true });
  writeFileSync(
    credPath,
    JSON.stringify(
      {
        email: ADMIN_EMAIL,
        phone,
        password,
        role: 'platform_admin',
        created_at: new Date().toISOString(),
        note: 'Store in a password manager. Delete this file after copying.',
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  console.log('\nAdmin credentials saved to prisma/.admin-credentials.json');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Phone:', phone);
  console.log('Password length:', password.length, 'chars');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
