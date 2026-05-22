import { NextResponse } from 'next/server';
import { getLariPayCoreBaseUrl, proxyToLariPayCore } from '@/lib/laripay-core/proxy';
import { PLATFORM_CAPABILITIES } from '@/lib/laripay-core/capabilities';

export const dynamic = 'force-dynamic';

export async function GET() {
  const coreUrl = getLariPayCoreBaseUrl();
  let coreHealth: { status?: string; service?: string } | null = null;
  let coreReachable = false;

  if (coreUrl) {
    try {
      const res = await proxyToLariPayCore('/health', { method: 'GET' });
      if (res?.ok) {
        coreReachable = true;
        coreHealth = (await res.json()) as { status?: string; service?: string };
      }
    } catch {
      coreReachable = false;
    }
  }

  return NextResponse.json({
    mode: coreUrl ? (coreReachable ? 'core' : 'core_unreachable') : 'legacy',
    coreUrl: coreUrl ? coreUrl.replace(/\/\/[^@]+@/, '//***@') : null,
    coreReachable,
    coreHealth,
    capabilities: PLATFORM_CAPABILITIES.length,
    docs: coreUrl ? `${coreUrl}/docs` : null,
  });
}
