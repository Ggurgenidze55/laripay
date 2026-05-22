import prisma from '@/lib/prisma';
import { dispatchMerchantWebhook } from './webhooks-outbound';

type SessionRow = {
  id: string;
  merchantId: string;
  status: string;
  expiresAt: Date;
  paykaPaymentId: string | null;
  amount: number;
  currency: string;
};

/**
 * Mark open sessions past expiresAt as expired and notify merchant.
 */
export async function expireCheckoutSessionIfNeeded<T extends SessionRow>(
  session: T,
): Promise<T> {
  if (session.status !== 'open') return session;
  if (session.expiresAt > new Date()) return session;

  await prisma.checkoutSession.update({
    where: { id: session.id },
    data: { status: 'expired' },
  });

  if (session.paykaPaymentId) {
    await prisma.paykaPayment.update({
      where: { id: session.paykaPaymentId },
      data: { status: 'failed' },
    });
  }

  await dispatchMerchantWebhook(session.merchantId, 'checkout.session.expired', {
    id: session.id,
    object: 'checkout.session',
    status: 'expired',
    payment_id: session.paykaPaymentId,
    amount: session.amount,
    currency: session.currency,
  });

  return { ...session, status: 'expired' };
}
