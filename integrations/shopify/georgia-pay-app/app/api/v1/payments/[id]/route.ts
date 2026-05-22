import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const payment = await prisma.paykaPayment.findFirst({
    where: { id: params.id, merchantId: auth.merchant.id },
  });

  if (!payment) {
    return laripayError('Payment not found', 404, 'resource_missing');
  }

  return laripayJson({
    id: payment.id,
    object: 'payment',
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    gross_amount: payment.grossAmount,
    platform_fee: payment.platformFee,
    net_amount: payment.netAmount,
    fee_mode: payment.feeMode,
    provider: payment.provider,
    bank_reference: payment.bankReference,
    client_reference_id: payment.clientReferenceId,
    created: Math.floor(payment.createdAt.getTime() / 1000),
  });
}
