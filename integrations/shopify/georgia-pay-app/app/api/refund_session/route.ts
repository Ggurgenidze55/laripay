import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShopBankConfig } from '@/lib/payment-service';
import { buildPaymentsClient } from '@/lib/georgian-payments';
import { resolveRefundSession, rejectRefundSession } from '@/lib/payments-api';

interface RefundSessionBody {
  id: string;
  gid: string;
  payment_id: string;
  amount: string;
  currency: string;
  test?: boolean;
}

export async function POST(request: NextRequest) {
  const shopDomain = request.headers.get('shopify-shop-domain');
  if (!shopDomain) {
    return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 });
  }

  let body: RefundSessionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payment = await prisma.paymentRecord.findUnique({
    where: { shopifyPaymentId: body.payment_id },
  });

  if (!payment?.bankReference) {
    await rejectRefundSession(shopDomain, body.gid, 'Original payment not found');
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const refundRecord = await prisma.refundRecord.upsert({
    where: { shopifyRefundId: body.id },
    create: {
      shopDomain,
      shopifyRefundId: body.id,
      shopifyRefundGid: body.gid,
      shopifyPaymentId: body.payment_id,
      amount: body.amount,
      currency: body.currency,
      bankReference: payment.bankReference,
    },
    update: { status: 'pending' },
  });

  try {
    const config = await getShopBankConfig(shopDomain);
    const client = buildPaymentsClient(config);
    await client.refund(payment.bankReference, parseFloat(body.amount), payment.bank as 'tbc' | 'bog');

    await resolveRefundSession(shopDomain, body.gid);
    await prisma.refundRecord.update({
      where: { id: refundRecord.id },
      data: { status: 'resolved' },
    });

    return NextResponse.json({}, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund failed';
    await rejectRefundSession(shopDomain, body.gid, message);
    await prisma.refundRecord.update({
      where: { id: refundRecord.id },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
