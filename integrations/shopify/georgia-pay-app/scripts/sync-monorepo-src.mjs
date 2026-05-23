#!/usr/bin/env node
/** Copy repo-root src/ into vendor for Railway (Root Directory has no monorepo access). */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = join(root, 'vendor/monorepo-src');
const monorepoSrc = join(root, '../../../src');

export function syncMonorepoSrc({ required = true } = {}) {
  if (existsSync(monorepoSrc)) {
    mkdirSync(join(root, 'vendor'), { recursive: true });
    cpSync(monorepoSrc, vendorDir, { recursive: true });
    console.log('[sync-monorepo-src] copied ../../../src → vendor/monorepo-src/');
    return vendorDir;
  }

  const entry = join(vendorDir, 'georgian-payments.cjs');
  if (existsSync(entry)) {
    console.log('[sync-monorepo-src] using committed vendor/monorepo-src/');
    return vendorDir;
  }

  const msg =
    '[sync-monorepo-src] missing vendor/monorepo-src and monorepo src/ not found — run npm run vendor:sync from a full clone';
  if (required) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncMonorepoSrc();
}
