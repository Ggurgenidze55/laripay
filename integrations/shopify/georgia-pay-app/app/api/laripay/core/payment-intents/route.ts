import { NextRequest, NextResponse } from 'next/server';
import { proxyCoreAuthenticated } from '@/lib/laripay-core/bff';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const idempotencyKey = request.headers.get('idempotency-key') || undefined;
  const headers: Record<string, string> = {};
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

  const proxied = await proxyCoreAuthenticated(request, '/v1/payment-intents', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
  if ('error' in proxied) {
    return NextResponse.json({ error: proxied.error }, { status: proxied.status });
  }
  const body = await proxied.json();
  return NextResponse.json(body, { status: proxied.status });
}
