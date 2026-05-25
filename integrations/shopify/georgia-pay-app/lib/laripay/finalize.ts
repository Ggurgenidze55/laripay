import prisma from '@/lib/prisma';
import { finalizePaymentFromBank } from '@/lib/payment-service';
import { buildMerchantPaymentsClient, getMerchantBankConfig } from './merchant-config';
import { dispatchMerchantWebhook } from './webhooks-outbound';
import { markShopifyOrderPaidFromSession } from './shopify-manual-payment';
import { expireCheckoutSessionIfNeeded } from './checkout-expiry';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';
import {
  isBankPaymentFailure,
  isBankPaymentSuccess,
} from '@/lib/georgian-banks/payment-status';

/**
 * Finalize a LariPay.ai checkout session after bank callback or return poll.
 */
export async function finalizeLariPayCheckout(
  sessionId: string,
  bankStatus: string,
  bankReference: string,
): Promise<{ status: string; redirectUrl?: string }> {
  let session = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    include: { paykaPayment: true, merchant: true },
  });

  if (!session) {
    throw new Error(`Checkout session not found: ${sessionId}`);
  }

  session = await expireCheckoutSessionIfNeeded(session);
  if (session.status === 'expired') {
    return { status: 'expired', redirectUrl: session.cancelUrl || session.successUrl };
  }

  if (session.status === 'complete' && session.paykaPayment?.status === 'succeeded') {
    return { status: 'complete', redirectUrl: session.successUrl };
  }

  const provider = session.provider as GeorgianBankId;

  if (isBankPaymentSuccess(provider, bankStatus)) {
    await prisma.paykaPayment.update({
      where: { id: session.paykaPaymentId! },
      data: { status: 'succeeded', bankReference },
    });
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: 'complete', bankReference },
    });

    const payment = await prisma.paykaPayment.findUniqueOrThrow({
      where: { id: session.paykaPaymentId! },
    });

    await dispatchMerchantWebhook(session.merchantId, 'payment.succeeded', {
      id: payment.id,
      object: 'payment',
      status: 'succeeded',
      amount: payment.amount,
      currency: payment.currency,
      platform_fee: payment.platformFee,
      net_amount: payment.netAmount,
      fee_mode: payment.feeMode,
      provider: payment.provider,
      bank_reference: bankReference,
      client_reference_id: payment.clientReferenceId,
    });

    await dispatchMerchantWebhook(session.merchantId, 'checkout.session.completed', {
      id: session.id,
      object: 'checkout.session',
      payment_id: payment.id,
      status: 'complete',
    });

    if (session.clientReferenceId?.startsWith('shopify_order_')) {
      try {
        await markShopifyOrderPaidFromSession(session.id);
      } catch (err) {
        console.error('[laripay] Shopify manual order mark-as-paid failed:', err);
      }
    }

    if (session.clientReferenceId) {
      const shopifyRecord = await prisma.paymentRecord.findUnique({
        where: { shopifyPaymentId: session.clientReferenceId },
      });
      if (shopifyRecord && shopifyRecord.shopDomain.endsWith('.myshopify.com')) {
        try {
          const shopifyResult = await finalizePaymentFromBank(
            session.clientReferenceId,
            bankStatus,
            bankReference,
          );
          return {
            status: 'complete',
            redirectUrl: shopifyResult.shopifyRedirectUrl || session.successUrl,
          };
        } catch (err) {
          console.error('[laripay] Shopify finalize after LariPay.ai success:', err);
        }
      }
    }

    return { status: 'complete', redirectUrl: session.successUrl };
  }

  if (isBankPaymentFailure(provider, bankStatus)) {
    await prisma.paykaPayment.update({
      where: { id: session.paykaPaymentId! },
      data: { status: 'failed' },
    });
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: 'canceled' },
    });

    await dispatchMerchantWebhook(session.merchantId, 'payment.failed', {
      id: session.paykaPaymentId,
      object: 'payment',
      status: 'failed',
      bank_status: bankStatus,
    });

    return { status: 'failed', redirectUrl: session.cancelUrl || session.successUrl };
  }

  return { status: 'processing' };
}

export async function pollAndFinalizeLariPay(sessionId: string) {
  const session = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
  });
  if (!session?.bankReference) {
    throw new Error('Missing bank reference for LariPay.ai session');
  }

  const config = await getMerchantBankConfig(session.merchantId);
  const provider = session.provider as GeorgianBankId;
  const payments = buildMerchantPaymentsClient({ ...config, provider });
  const statusResult = await payments.checkStatus(session.bankReference, provider);

  return finalizeLariPayCheckout(sessionId, statusResult.status, session.bankReference);
}

/**
 * Route bank webhook/return to Shopify or LariPay.ai flow.
 */
export async function finalizePaymentByReference(
  paymentIdOrSessionId: string,
  bankStatus: string,
  bankReference: string,
): Promise<{ type: 'shopify' | 'laripay'; status: string; redirectUrl?: string }> {
  const laripaySession = await prisma.checkoutSession.findUnique({
    where: { id: paymentIdOrSessionId },
  });

  if (laripaySession?.paykaPaymentId) {
    const result = await finalizeLariPayCheckout(paymentIdOrSessionId, bankStatus, bankReference);
    return { type: 'laripay', ...result };
  }

  const byBank = await prisma.checkoutSession.findFirst({
    where: { bankReference },
  });
  if (byBank) {
    const result = await finalizeLariPayCheckout(byBank.id, bankStatus, bankReference);
    return { type: 'laripay', ...result };
  }

  const shopifyRecord = await prisma.paymentRecord.findUnique({
    where: { shopifyPaymentId: paymentIdOrSessionId },
  });

  if (shopifyRecord) {
    const result = await finalizePaymentFromBank(paymentIdOrSessionId, bankStatus, bankReference);
    return { type: 'shopify', status: result.status, redirectUrl: result.shopifyRedirectUrl };
  }

  const shopifyByBank = await prisma.paymentRecord.findFirst({
    where: { bankReference },
  });
  if (shopifyByBank) {
    const result = await finalizePaymentFromBank(
      shopifyByBank.shopifyPaymentId,
      bankStatus,
      bankReference,
    );
    return { type: 'shopify', status: result.status, redirectUrl: result.shopifyRedirectUrl };
  }

  throw new Error(`Payment not found: ${paymentIdOrSessionId}`);
}
