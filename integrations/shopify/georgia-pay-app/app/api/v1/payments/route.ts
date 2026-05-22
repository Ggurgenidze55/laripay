import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100);
  const status = request.nextUrl.searchParams.get('status');

  const payments = await prisma.paykaPayment.findMany({
    where: {
      merchantId: auth.merchant.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return laripayJson({
    object: 'list',
    data: payments.map((p) => ({
      id: p.id,
      object: 'payment',
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      gross_amount: p.grossAmount,
      platform_fee: p.platformFee,
      net_amount: p.netAmount,
      fee_mode: p.feeMode,
      provider: p.provider,
      client_reference_id: p.clientReferenceId,
      created: Math.floor(p.createdAt.getTime() / 1000),
    })),
  });
}
