import { NextRequest, NextResponse } from 'next/server';
import { handleBankWebhook } from '@/lib/bank-webhook';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider;
  if (provider !== 'tbc' && provider !== 'bog') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }
  return handleBankWebhook(request, provider);
}
