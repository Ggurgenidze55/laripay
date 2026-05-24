#!/usr/bin/env node
/** Railway start: optional quick migrate, then Next.js (must not block on sleeping Postgres). */
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATE_TIMEOUT_MS = 20_000;

const dbUrl = process.env.DATABASE_URL?.trim();
if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl)) {
  const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    timeout: MIGRATE_TIMEOUT_MS,
  });
  if (migrate.error?.code === 'ETIMEDOUT') {
    console.warn(
      '[railway-start] migrate timed out — Postgres may be waking up; starting Next.js anyway',
    );
  } else if (migrate.status !== 0) {
    console.warn('[railway-start] migrate failed — starting Next.js anyway');
  }
}

const port = process.env.PORT || '3000';
const nextBin = join(root, 'node_modules/next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
