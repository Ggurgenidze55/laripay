import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError } from '@/lib/laripay/api-response';
import { zipWordPressPlugin } from '@/lib/laripay/zip-wordpress-plugin';

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

  try {
    const buf = await zipWordPressPlugin(params.plugin);
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
