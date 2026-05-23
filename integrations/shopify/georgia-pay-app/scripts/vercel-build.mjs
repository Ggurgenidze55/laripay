#!/usr/bin/env node
/**
 * Vercel production build: PostgreSQL schema + generate + optional migrate + Next build.
 * schema.postgresql.prisma must stay in sync with schema.prisma (canonical).
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });

function ensureGeorgianPaymentsVendor() {
  const vendored = join(root, 'vendor/georgian-payments/georgian-payments.cjs');
  if (existsSync(vendored)) return;
  const monorepo = join(root, '../../../src/georgian-payments.cjs');
  if (!existsSync(monorepo)) return;
  mkdirSync(join(root, 'vendor/georgian-payments'), { recursive: true });
  copyFileSync(monorepo, vendored);
  console.log('[production-build] vendored georgian-payments from monorepo src/');
}

ensureGeorgianPaymentsVendor();

copyFileSync(
  join(root, 'prisma/schema.postgresql.prisma'),
  join(root, 'prisma/schema.prisma'),
);

run('npx prisma generate');

const dbUrl = process.env.DATABASE_URL?.trim();
if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl)) {
  try {
    run('npx prisma migrate deploy');
  } catch (err) {
    console.warn('[vercel-build] prisma migrate deploy failed; continuing build:', err?.message || err);
  }
} else {
  console.warn('[vercel-build] DATABASE_URL not set — skipping migrate (set it in Vercel for Production).');
}

run('npx next build');
