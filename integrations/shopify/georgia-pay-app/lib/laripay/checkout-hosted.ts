import prisma from '@/lib/prisma';
import { expireCheckoutSessionIfNeeded } from './checkout-expiry';
import { initiateBankPaymentForSession } from './checkout';

export async function getPublicCheckoutSession(sessionId: string) {
  const row = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    include: {
      merchant: { select: { name: true } },
      paykaPayment: { select: { status: true } },
    },
  });
  if (!row) return null;

  const session = await expireCheckoutSessionIfNeeded(row);

  return {
    id: session.id,
    status: session.status,
    amount: session.amount,
    currency: session.currency,
    provider: session.provider as 'tbc' | 'bog',
    merchant_name: row.merchant.name,
    redirect_url: session.redirectUrl,
    cancel_url: session.cancelUrl,
    success_url: session.successUrl,
    expires_at: Math.floor(session.expiresAt.getTime() / 1000),
    payment_status: row.paykaPayment?.status ?? null,
  };
}

export async function confirmHostedCheckoutSession(sessionId: string, provider: 'tbc' | 'bog') {
  const row = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    include: { paykaPayment: true },
  });
  if (!row) return { error: 'not_found' as const };
  if (row.status !== 'open') return { error: 'not_open' as const, status: row.status };

  const session = await expireCheckoutSessionIfNeeded(row);
  if (session.status !== 'open') {
    return { error: 'expired' as const };
  }

  if (session.redirectUrl) {
    return { redirect_url: session.redirectUrl };
  }

  if (session.provider !== provider) {
    await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { provider },
    });
  }

  try {
    const result = await initiateBankPaymentForSession(sessionId, provider);
    return { redirect_url: result.redirectUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment failed';
    return { error: 'bank_error' as const, message };
  }
}
