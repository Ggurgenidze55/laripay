#!/usr/bin/env node
/**
 * Sync selected keys from .env → Vercel (production + preview).
 * Usage: node scripts/sync-vercel-env.mjs
 * Requires: vercel CLI logged in, .env in georgia-pay-app root.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

const KEYS = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'NEXT_PUBLIC_SHOPIFY_API_KEY',
  'HOST',
  'NEXT_PUBLIC_HOST',
  'DATABASE_URL',
  'LARIPAY_ALLOW_SIGNUP',
  'LARIPAY_REQUIRE_2FA',
  'LARIPAY_PORTAL_SECRET',
  'LARIPAY_ADMIN_SECRET',
  'SCOPES',
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error('[sync-vercel-env] Missing .env — copy from .env.example and fill Shopify keys.');
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));

if (!env.SHOPIFY_API_KEY?.trim() || !env.SHOPIFY_API_SECRET?.trim()) {
  console.error('[sync-vercel-env] SHOPIFY_API_KEY and SHOPIFY_API_SECRET required in .env');
  process.exit(1);
}

if (!env.NEXT_PUBLIC_SHOPIFY_API_KEY?.trim()) {
  env.NEXT_PUBLIC_SHOPIFY_API_KEY = env.SHOPIFY_API_KEY;
}

if (!env.LARIPAY_PORTAL_SECRET?.trim()) {
  env.LARIPAY_PORTAL_SECRET = randomBytes(32).toString('hex');
  console.log('[sync-vercel-env] Generated LARIPAY_PORTAL_SECRET (also add to .env locally if needed).');
}

if (env.SCOPES === undefined) {
  env.SCOPES = '';
}

const environments = ['production', 'preview'];

function upsert(key, value, environment) {
  const sensitive = key.includes('SECRET') || key.includes('DATABASE') || key === 'SHOPIFY_API_KEY';
  const args = [
    'env',
    'add',
    key,
    environment,
    '--yes',
    '--force',
    '--value',
    value,
  ];
  if (sensitive) args.push('--sensitive');
  const cmd = `npx vercel ${args.map((a) => JSON.stringify(a)).join(' ')}`;
  execSync(cmd, { cwd: root, stdio: 'pipe' });
  console.log(`[sync-vercel-env] ${key} → ${environment}`);
}

for (const key of KEYS) {
  const value = env[key];
  if (value === undefined || value === '') {
    if (key === 'SCOPES') {
      for (const environment of environments) {
        upsert(key, '', environment);
      }
    } else if (key !== 'LARIPAY_ADMIN_SECRET') {
      console.warn(`[sync-vercel-env] skip ${key} (empty)`);
    }
    continue;
  }
  for (const environment of environments) {
    upsert(key, value, environment);
  }
}

console.log('[sync-vercel-env] Done. Run: npx vercel deploy --prod');
