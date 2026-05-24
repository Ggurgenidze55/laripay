#!/usr/bin/env node
/**
 * Production build: PostgreSQL schema + generate + optional migrate + Next build.
 * schema.postgresql.prisma must stay in sync with schema.prisma (canonical).
 */
import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncMonorepoSrc } from './sync-monorepo-src.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });

syncMonorepoSrc();

copyFileSync(
  join(root, 'prisma/schema.postgresql.prisma'),
  join(root, 'prisma/schema.prisma'),
);

run('npx prisma generate');

const dbUrl = process.env.DATABASE_URL?.trim();
const skipMigrate =
  process.env.RAILWAY === 'true' ||
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.SKIP_PRISMA_MIGRATE === '1';

if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl) && !skipMigrate) {
  try {
    run('npx prisma migrate deploy');
  } catch (err) {
    console.warn('[production-build] prisma migrate deploy failed; continuing build:', err?.message || err);
  }
} else if (skipMigrate) {
  console.warn('[production-build] skipping prisma migrate deploy at build time (Railway — runs on start).');
} else {
  console.warn('[production-build] DATABASE_URL not set — skipping migrate.');
}

try {
  run('node scripts/build-integration-packages.mjs');
} catch (err) {
  console.warn(
    '[production-build] integration package build failed; plugin downloads may be unavailable:',
    err?.message || err,
  );
}

run('npx next build');
