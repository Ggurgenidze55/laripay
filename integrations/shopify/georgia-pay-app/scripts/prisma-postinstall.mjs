#!/usr/bin/env node
/** Safe prisma generate on Vercel when DATABASE_URL is not set yet (dev SQLite). */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
execSync('npx prisma generate', { cwd: root, stdio: 'inherit', env: process.env });
