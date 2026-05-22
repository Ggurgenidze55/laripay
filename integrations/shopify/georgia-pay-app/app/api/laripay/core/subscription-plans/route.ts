import { NextResponse } from 'next/server';
import { proxyCorePublic } from '@/lib/laripay-core/bff';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proxied = await proxyCorePublic('/v1/subscription-plans', { method: 'GET' });
  if ('error' in proxied) {
    return NextResponse.json({ error: proxied.error }, { status: proxied.status });
  }
  const body = await proxied.json();
  return NextResponse.json(body, { status: proxied.status });
}
