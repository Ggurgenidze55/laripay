import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { IntegrationPackageId } from '@/lib/laripay/integration-package-ids';

const PREBUILD_DIR = path.join(process.cwd(), 'integration-packages');

/** Read pre-built ZIP from build time (Vercel/Railway). No monorepo paths — safe for file tracing. */
export function readIntegrationPackage(packageId: IntegrationPackageId): Buffer {
  const file = path.join(PREBUILD_DIR, `${packageId}.zip`);
  if (!existsSync(file)) {
    throw new Error('Package not found — rebuild or run scripts/build-integration-packages.mjs');
  }
  return readFileSync(file);
}
