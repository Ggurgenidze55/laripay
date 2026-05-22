import { NextRequest, NextResponse } from 'next/server';
import {
  confirmHostedCheckoutSession,
  getPublicCheckoutSession,
} from '@/lib/laripay/checkout-hosted';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getPublicCheckoutSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let body: { provider?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const provider = body.provider === 'bog' ? 'bog' : body.provider === 'tbc' ? 'tbc' : null;
  if (!provider) {
    return NextResponse.json({ error: 'provider must be tbc or bog' }, { status: 400 });
  }

  const result = await confirmHostedCheckoutSession(params.id, provider);
  if ('error' in result) {
    const status =
      result.error === 'not_found' ? 404 : result.error === 'bank_error' ? 422 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
