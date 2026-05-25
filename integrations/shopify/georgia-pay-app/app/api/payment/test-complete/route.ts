import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { markShopifyOrderPaidFromSession } from '@/lib/laripay/shopify-manual-payment';
import { dispatchMerchantWebhook } from '@/lib/laripay/webhooks-outbound';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { sessionId, action } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const session = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    include: { paykaPayment: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (action === 'approve') {
    await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'complete' },
    });

    if (session.paykaPaymentId) {
      await prisma.paykaPayment.update({
        where: { id: session.paykaPaymentId },
        data: { status: 'success' },
      });
    }

    let shopifyMarked = false;
    if (session.clientReferenceId?.startsWith('shopify_order_')) {
      shopifyMarked = await markShopifyOrderPaidFromSession(sessionId);
    }

    await dispatchMerchantWebhook(session.merchantId, 'checkout.session.completed', {
      id: session.id,
      object: 'checkout.session',
      status: 'complete',
      amount: session.amount,
      currency: session.currency,
      test_mode: true,
    }).catch(() => {});

    console.log(`[test-payment] APPROVED session ${sessionId}, shopify marked: ${shopifyMarked}`);

    return NextResponse.json({
      success: true,
      status: 'approved',
      sessionId,
      shopifyMarked,
      successUrl: session.successUrl,
    });
  }

  if (action === 'decline') {
    await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'expired' },
    });

    if (session.paykaPaymentId) {
      await prisma.paykaPayment.update({
        where: { id: session.paykaPaymentId },
        data: { status: 'failed' },
      });
    }

    console.log(`[test-payment] DECLINED session ${sessionId}`);

    return NextResponse.json({
      success: true,
      status: 'declined',
      sessionId,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
