import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import type { IntegrationPackageId } from '@/lib/laripay/integration-package-ids';

const PACKAGES: Record<IntegrationPackageId, { parent: string; folder: string }> = {
  'georgia-pay': { parent: '../../wordpress', folder: 'georgia-pay' },
  'georgia-delivery': { parent: '../../wordpress', folder: 'georgia-delivery' },
  'georgia-warehouse': { parent: '../../wordpress', folder: 'georgia-warehouse' },
  'laripay-cscart': { parent: '../../cscart/app/addons', folder: 'laripay_georgia' },
  'laripay-opencart': { parent: '../../opencart', folder: 'upload' },
  'laripay-prestashop': { parent: '../../prestashop', folder: 'laripaygeorgia' },
};

/** Local dev fallback when pre-built ZIPs are missing. Not imported by API routes. */
export function zipIntegrationPackageLive(packageId: IntegrationPackageId): Promise<Buffer> {
  const spec = PACKAGES[packageId];
  const dir = path.resolve(process.cwd(), spec.parent, spec.folder);
  if (!existsSync(dir)) return Promise.reject(new Error('Package not found'));

  const parent = path.resolve(process.cwd(), spec.parent);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn('zip', ['-r', '-q', '-', spec.folder], {
      cwd: parent,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => chunks.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`zip failed (${code})`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}
