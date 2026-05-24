import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export type IntegrationPackageId =
  | 'georgia-pay'
  | 'georgia-delivery'
  | 'georgia-warehouse'
  | 'laripay-cscart'
  | 'laripay-opencart'
  | 'laripay-prestashop';

const PACKAGES: Record<IntegrationPackageId, { parent: string; folder: string }> = {
  'georgia-pay': { parent: '../../wordpress', folder: 'georgia-pay' },
  'georgia-delivery': { parent: '../../wordpress', folder: 'georgia-delivery' },
  'georgia-warehouse': { parent: '../../wordpress', folder: 'georgia-warehouse' },
  'laripay-cscart': { parent: '../../cscart/app/addons', folder: 'laripay_georgia' },
  'laripay-opencart': { parent: '../../opencart', folder: 'upload' },
  'laripay-prestashop': { parent: '../../prestashop', folder: 'laripaygeorgia' },
};

export function isIntegrationPackageId(id: string): id is IntegrationPackageId {
  return id in PACKAGES;
}

export function resolveIntegrationPackageDir(packageId: IntegrationPackageId): string | null {
  const spec = PACKAGES[packageId];
  const root = path.resolve(process.cwd(), spec.parent, spec.folder);
  if (!existsSync(root)) return null;
  return root;
}

export function zipIntegrationPackage(packageId: IntegrationPackageId): Promise<Buffer> {
  const spec = PACKAGES[packageId];
  const dir = resolveIntegrationPackageDir(packageId);
  if (!dir) return Promise.reject(new Error('Package not found'));

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

/** @deprecated use zipIntegrationPackage */
export const zipWordPressPlugin = zipIntegrationPackage;
