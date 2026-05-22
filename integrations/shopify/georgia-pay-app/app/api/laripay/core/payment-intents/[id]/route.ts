import { NextRequest, NextResponse } from 'next/server';
import { proxyCoreAuthenticated } from '@/lib/laripay-core/bff';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const proxied = await proxyCoreAuthenticated(
    request,
    `/v1/payment-intents/${encodeURIComponent(params.id)}`,
    { method: 'GET' },
  );
  if ('error' in proxied) {
    return NextResponse.json({ error: proxied.error }, { status: proxied.status });
  }
  const body = await proxied.json();
  return NextResponse.json(body, { status: proxied.status });
}
