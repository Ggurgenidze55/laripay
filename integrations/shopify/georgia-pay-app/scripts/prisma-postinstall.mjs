#!/usr/bin/env node
/** Safe prisma generate when DATABASE_URL is missing (schema requires PostgreSQL). */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL?.trim();
if (!url || url.startsWith('file:')) {
  process.env.DATABASE_URL =
    'postgresql://laripay:laripay_dev_change_me@localhost:5433/laripay?schema=public';
}
execSync('npx prisma generate', { cwd: root, stdio: 'inherit', env: process.env });
