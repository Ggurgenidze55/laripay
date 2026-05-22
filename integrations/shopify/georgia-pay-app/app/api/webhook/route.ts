import { NextRequest, NextResponse } from 'next/server';
import { handleBankWebhook } from '@/lib/bank-webhook';

function detectProvider(rawBody: string): 'tbc' | 'bog' | null {
  try {
    const data = JSON.parse(rawBody);
    if (data.PaymentId || data.paymentId || data.payId) {
      return 'tbc';
    }
    if (data.event === 'order_payment' || data.body?.order_id) {
      return 'bog';
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Unified LariPay.ai webhook — LARIPAY_WEBHOOK_URL=https://host/api/webhook
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const provider =
    (request.nextUrl.searchParams.get('provider') as 'tbc' | 'bog' | null) ||
    detectProvider(rawBody);

  if (provider !== 'tbc' && provider !== 'bog') {
    return NextResponse.json({ error: 'Unknown webhook provider' }, { status: 400 });
  }

  const synthetic = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: rawBody,
  });

  return handleBankWebhook(synthetic, provider, rawBody);
}
