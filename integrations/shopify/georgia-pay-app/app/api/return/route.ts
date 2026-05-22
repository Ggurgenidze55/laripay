import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { pollAndFinalize } from '@/lib/payment-service';

/**
 * Customer return URL after bank checkout — poll status and redirect to Shopify.
 */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
  }

  const record = await prisma.paymentRecord.findUnique({
    where: { shopifyPaymentId: paymentId },
  });

  if (!record) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  try {
    const result = await pollAndFinalize(paymentId);

    if (result.shopifyRedirectUrl) {
      return NextResponse.redirect(result.shopifyRedirectUrl);
    }

    if (result.status === 'rejected' && record.cancelUrl) {
      return NextResponse.redirect(record.cancelUrl);
    }

    return NextResponse.redirect(
      record.cancelUrl || `https://${record.shopDomain}`,
    );
  } catch (error) {
    console.error('[return]', error);
    if (record.cancelUrl) {
      return NextResponse.redirect(record.cancelUrl);
    }
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 });
  }
}
