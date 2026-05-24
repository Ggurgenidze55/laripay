import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError } from '@/lib/laripay/api-response';
import { isIntegrationPackageId } from '@/lib/laripay/integration-package-ids';
import { readIntegrationPackage } from '@/lib/laripay/read-integration-package';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { plugin: string } },
) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  if (!isIntegrationPackageId(params.plugin)) {
    return laripayError('Unknown package', 404);
  }

  try {
    const buf = await readIntegrationPackage(params.plugin);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${params.plugin}.zip"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Download failed';
    return laripayError(message, 404);
  }
}
