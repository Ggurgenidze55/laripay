export type { IntegrationPackageId } from '@/lib/laripay/integration-package-ids';
export { isIntegrationPackageId } from '@/lib/laripay/integration-package-ids';
export { readIntegrationPackage } from '@/lib/laripay/read-integration-package';

import type { IntegrationPackageId } from '@/lib/laripay/integration-package-ids';
import { readIntegrationPackage } from '@/lib/laripay/read-integration-package';

/** Prefer pre-built ZIP; fall back to live zip in local dev only. */
export async function readIntegrationPackageWithFallback(
  packageId: IntegrationPackageId,
): Promise<Buffer> {
  try {
    return readIntegrationPackage(packageId);
  } catch {
    const { zipIntegrationPackageLive } = await import('@/lib/laripay/zip-integration-package-live');
    return zipIntegrationPackageLive(packageId);
  }
}

/** @deprecated use readIntegrationPackageWithFallback */
export const zipIntegrationPackage = readIntegrationPackageWithFallback;
export const zipWordPressPlugin = readIntegrationPackageWithFallback;
