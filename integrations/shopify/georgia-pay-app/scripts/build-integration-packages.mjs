#!/usr/bin/env node
/**
 * Pre-build plugin ZIPs for Vercel/Railway (avoids 250MB serverless trace from live `zip`).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'integration-packages');

const PACKAGES = {
  'georgia-pay': { parent: '../../wordpress', folder: 'georgia-pay' },
  'georgia-delivery': { parent: '../../wordpress', folder: 'georgia-delivery' },
  'georgia-warehouse': { parent: '../../wordpress', folder: 'georgia-warehouse' },
  'laripay-cscart': { parent: '../../cscart/app/addons', folder: 'laripay_georgia' },
  'laripay-opencart': { parent: '../../opencart', folder: 'upload' },
  'laripay-prestashop': { parent: '../../prestashop', folder: 'laripaygeorgia' },
};

function zipToFile(packageId, spec) {
  const parent = join(root, spec.parent);
  const source = join(parent, spec.folder);
  if (!existsSync(source)) {
    console.warn(`[integration-packages] skip ${packageId} — missing ${source}`);
    return Promise.resolve(false);
  }

  const dest = join(outDir, `${packageId}.zip`);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const proc = spawn('zip', ['-r', '-q', '-', spec.folder], {
      cwd: parent,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.stdout.on('data', (c) => chunks.push(c));
    proc.stderr.on('data', (c) => chunks.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`zip ${packageId} failed (${code})`));
        return;
      }
      const buf = Buffer.concat(chunks);
      writeFileSync(dest, buf);
      console.log(`[integration-packages] ${packageId}.zip (${Math.round(buf.length / 1024)} KB)`);
      resolve(true);
    });
  });
}

mkdirSync(outDir, { recursive: true });

let built = 0;
for (const [id, spec] of Object.entries(PACKAGES)) {
  // eslint-disable-next-line no-await-in-loop
  if (await zipToFile(id, spec)) built += 1;
}

if (built === 0) {
  console.warn('[integration-packages] no packages built (sources missing in CI?)');
} else {
  console.log(`[integration-packages] built ${built} package(s) → ${outDir}`);
}
