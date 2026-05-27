import { NextRequest, NextResponse } from 'next/server';
import { updateCheckoutSessionProvider } from '@/lib/laripay/checkout';
import { isGeorgianBankId } from '@/lib/georgian-banks/registry';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { sessionId, provider } = await request.json();

  if (!sessionId || !provider) {
    return NextResponse.json({ error: 'sessionId and provider required' }, { status: 400 });
  }

  if (!isGeorgianBankId(String(provider))) {
    return NextResponse.json({ error: 'Invalid bank provider' }, { status: 400 });
  }

  try {
    const result = await updateCheckoutSessionProvider(String(sessionId), provider);
    return NextResponse.json({ success: true, provider: result.provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update bank';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
