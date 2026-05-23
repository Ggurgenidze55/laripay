#!/usr/bin/env node
/** Railway start: migrate DB when Postgres is awake, then Next.js. */
import { execSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });

const dbUrl = process.env.DATABASE_URL?.trim();
if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl)) {
  try {
    run('npx prisma migrate deploy');
  } catch (err) {
    console.warn('[railway-start] prisma migrate deploy failed:', err?.message || err);
  }
}

const port = process.env.PORT || '3000';
const result = spawnSync('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
