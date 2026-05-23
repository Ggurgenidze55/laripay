import { NextRequest, NextResponse } from 'next/server';
import { pollAndFinalize, isShopifyHostedPayment } from '@/lib/payment-service';
import { pollAndFinalizeLariPay } from '@/lib/laripay/finalize';
import prisma from '@/lib/prisma';

/**
 * LariPay.ai return URL — LARIPAY_RETURN_URL=https://host/payment/return
 */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
  }

  const laripaySession = await prisma.checkoutSession.findUnique({
    where: { id: paymentId },
  });

  if (laripaySession) {
    try {
      const result = await pollAndFinalizeLariPay(paymentId);
      if (result.redirectUrl) {
        return NextResponse.redirect(result.redirectUrl);
      }
      return NextResponse.json({ status: result.status });
    } catch (error) {
      console.error('[payment/return laripay]', error);
      const url = laripaySession.cancelUrl || laripaySession.successUrl;
      return NextResponse.redirect(url);
    }
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

    if (result.status === 'resolved' && !isShopifyHostedPayment(record.shopDomain)) {
      const base = process.env.HOST || request.nextUrl.origin;
      return NextResponse.redirect(`${base}/laripay/en/dashboard?paid=1`);
    }

    if (record.cancelUrl) {
      return NextResponse.redirect(record.cancelUrl);
    }

    if (isShopifyHostedPayment(record.shopDomain)) {
      return NextResponse.redirect(`https://${record.shopDomain}`);
    }

    return NextResponse.json({ status: result.status });
  } catch (error) {
    console.error('[payment/return]', error);
    if (record.cancelUrl) {
      return NextResponse.redirect(record.cancelUrl);
    }
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 });
  }
}
