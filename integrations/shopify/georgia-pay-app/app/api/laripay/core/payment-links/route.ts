import { NextRequest, NextResponse } from 'next/server';
import { proxyCoreAuthenticated } from '@/lib/laripay-core/bff';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const proxied = await proxyCoreAuthenticated(request, '/v1/payment-links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if ('error' in proxied) {
    return NextResponse.json({ error: proxied.error }, { status: proxied.status });
  }
  const body = await proxied.json();
  return NextResponse.json(body, { status: proxied.status });
}
