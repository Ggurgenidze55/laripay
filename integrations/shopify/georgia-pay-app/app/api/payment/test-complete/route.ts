import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { markShopifyOrderPaidFromSession } from '@/lib/laripay/shopify-manual-payment';
import { cancelOrder } from '@/lib/shopify-admin';
import { dispatchMerchantWebhook } from '@/lib/laripay/webhooks-outbound';
import { appendLariPayResult } from '@/lib/laripay/redirect-result';

export const runtime = 'nodejs';

function parseShopifyMeta(session: { clientReferenceId: string | null; metadata: string | null }) {
  if (!session.clientReferenceId?.startsWith('shopify_order_')) return null;
  try {
    const meta = session.metadata ? JSON.parse(session.metadata) : {};
    return {
      orderId: meta.shopify_order_id || meta.shopify_order_gid,
      shopDomain: meta.shop_domain as string | undefined,
      orderStatusUrl: meta.order_status_url as string | undefined,
    };
  } catch {
    return null;
  }
}

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

  const shopifyInfo = parseShopifyMeta(session);

  if (action === 'approve') {
    await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'complete' },
    });

    if (session.paykaPaymentId) {
      await prisma.paykaPayment.update({
        where: { id: session.paykaPaymentId },
        data: { status: 'succeeded' },
      });
    }

    const payment = session.paykaPaymentId
      ? await prisma.paykaPayment.findUnique({ where: { id: session.paykaPaymentId } })
      : null;

    await dispatchMerchantWebhook(session.merchantId, 'payment.succeeded', {
      id: payment?.id || session.paykaPaymentId || session.id,
      object: 'payment',
      status: 'succeeded',
      amount: session.amount,
      currency: session.currency,
      client_reference_id: session.clientReferenceId,
      test_mode: true,
    }).catch(() => {});

    await dispatchMerchantWebhook(session.merchantId, 'checkout.session.completed', {
      id: session.id,
      object: 'checkout.session',
      status: 'complete',
      amount: session.amount,
      currency: session.currency,
      test_mode: true,
    }).catch(() => {});

    let shopifyMarked = false;
    if (shopifyInfo) {
      shopifyMarked = await markShopifyOrderPaidFromSession(sessionId);
    }

    console.log(`[test-payment] APPROVED session ${sessionId}, shopify marked: ${shopifyMarked}`);

    return NextResponse.json({
      success: true,
      status: 'approved',
      sessionId,
      shopifyMarked,
      successUrl: appendLariPayResult(session.successUrl, 'success'),
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

    let shopifyCancelled = false;
    if (shopifyInfo?.shopDomain && shopifyInfo.orderId) {
      try {
        const result = await cancelOrder(shopifyInfo.shopDomain, String(shopifyInfo.orderId), {
          notifyCustomer: true,
          staffNote: 'Payment declined by customer via LariPay',
        });
        shopifyCancelled = result.success;
        console.log(`[test-payment] Cancel order result:`, result);
      } catch (err) {
        console.error(`[test-payment] Failed to cancel Shopify order:`, err);
      }
    }

    await dispatchMerchantWebhook(session.merchantId, 'payment.failed', {
      id: session.paykaPaymentId || session.id,
      object: 'payment',
      status: 'failed',
      client_reference_id: session.clientReferenceId,
      test_mode: true,
    }).catch(() => {});

    await dispatchMerchantWebhook(session.merchantId, 'checkout.session.expired', {
      id: session.id,
      object: 'checkout.session',
      status: 'declined',
      amount: session.amount,
      currency: session.currency,
      test_mode: true,
    }).catch(() => {});

    console.log(`[test-payment] DECLINED session ${sessionId}, shopify cancelled: ${shopifyCancelled}`);

    return NextResponse.json({
      success: true,
      status: 'declined',
      sessionId,
      shopifyCancelled,
      cancelUrl: appendLariPayResult(session.cancelUrl || session.successUrl, 'failed'),
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
