import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const record = await prisma.paymentRecord.findUnique({
    where: { id: params.id },
  });

  if (!record) {
    return new NextResponse('Payment not found', { status: 404 });
  }

  if (record.status === 'redirecting' && record.bankReference) {
    const config = await import('@/lib/payment-service').then((m) =>
      m.getShopBankConfig(record.shopDomain),
    );
    const { buildPaymentsClient } = await import('@/lib/georgian-payments');
    const payments = buildPaymentsClient(config);

    try {
      const status = await payments.checkStatus(record.bankReference, record.bank as 'tbc' | 'bog');
      if (status.raw?.links) {
        const link = status.raw.links.find((l: { rel?: string }) => l.rel === 'approval_url');
        if (link?.uri) {
          return NextResponse.redirect(link.uri);
        }
      }
      if (status.raw?._links?.redirect?.href) {
        return NextResponse.redirect(status.raw._links.redirect.href);
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.redirect(`/api/return?paymentId=${encodeURIComponent(record.shopifyPaymentId)}`);
}
