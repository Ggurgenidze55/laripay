import prisma from '@/lib/prisma';
import { buildMerchantPaymentsClient, getMerchantBankConfig } from './merchant-config';
import { dispatchMerchantWebhook } from './webhooks-outbound';
import type { AuthenticatedMerchant } from './auth';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';

export interface CreateRefundInput {
  paymentId: string;
  amount?: number;
  reason?: string;
  idempotencyKey?: string;
}

export async function createRefund(merchant: AuthenticatedMerchant, input: CreateRefundInput) {
  if (input.idempotencyKey) {
    const existing = await prisma.paykaRefund.findUnique({
      where: {
        merchantId_idempotencyKey: {
          merchantId: merchant.id,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) {
      return serializeRefund(existing);
    }
  }

  const payment = await prisma.paykaPayment.findFirst({
    where: { id: input.paymentId, merchantId: merchant.id },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'succeeded') {
    throw new Error('Only succeeded payments can be refunded');
  }

  if (!payment.bankReference) {
    throw new Error('Payment has no bank reference');
  }

  const refundAmount = input.amount ?? payment.amount;
  if (refundAmount <= 0 || refundAmount > payment.amount) {
    throw new Error('Invalid refund amount');
  }

  const prior = await prisma.paykaRefund.aggregate({
    where: { paymentId: payment.id, status: 'succeeded' },
    _sum: { amount: true },
  });
  const alreadyRefunded = prior._sum.amount ?? 0;
  if (alreadyRefunded + refundAmount > payment.amount + 0.001) {
    throw new Error(
      `Refund exceeds remaining balance (${(payment.amount - alreadyRefunded).toFixed(2)} GEL left)`,
    );
  }

  const record = await prisma.paykaRefund.create({
    data: {
      merchantId: merchant.id,
      paymentId: payment.id,
      amount: refundAmount,
      currency: payment.currency,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      status: 'pending',
    },
  });

  try {
    const config = await getMerchantBankConfig(merchant.id);
    const provider = payment.provider as GeorgianBankId;
    const client = buildMerchantPaymentsClient({
      ...config,
      provider,
    });

    await client.refund(payment.bankReference, refundAmount, provider);

    const updated = await prisma.paykaRefund.update({
      where: { id: record.id },
      data: { status: 'succeeded', bankReference: payment.bankReference },
    });

    await dispatchMerchantWebhook(merchant.id, 'payment.refunded', {
      id: updated.id,
      object: 'refund',
      payment_id: payment.id,
      amount: refundAmount,
      status: 'succeeded',
    });

    return serializeRefund(updated);
  } catch (err) {
    await prisma.paykaRefund.update({
      where: { id: record.id },
      data: {
        status: 'failed',
        reason: `${input.reason || ''} | ${err instanceof Error ? err.message : 'failed'}`.trim(),
      },
    });
    throw err;
  }
}

export function serializeRefund(r: {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  createdAt: Date;
}) {
  return {
    id: r.id,
    object: 'refund' as const,
    payment_id: r.paymentId,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    reason: r.reason,
    created: Math.floor(r.createdAt.getTime() / 1000),
  };
}
