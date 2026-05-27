import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMerchantBankConfig, isBankConfigured } from '@/lib/laripay/merchant-config';
import { GEORGIAN_BANKS, georgianBankLabel } from '@/lib/georgian-banks/registry';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const session = await prisma.checkoutSession.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      clientReferenceId: true,
      provider: true,
      paymentMode: true,
      merchantId: true,
      createdAt: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const config = await getMerchantBankConfig(session.merchantId);
  const locale = request.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en';
  const banks = GEORGIAN_BANKS.filter((bank) => isBankConfigured(config, bank.id)).map((bank) => ({
    id: bank.id,
    name: georgianBankLabel(bank.id, locale),
    name_en: georgianBankLabel(bank.id, 'en'),
    name_ka: georgianBankLabel(bank.id, 'ka'),
  }));

  return NextResponse.json({
    id: session.id,
    amount: session.amount,
    currency: session.currency,
    status: session.status,
    client_reference_id: session.clientReferenceId,
    provider: session.provider,
    payment_mode: session.paymentMode || 'card',
    banks,
    default_provider: config.provider,
    created: session.createdAt.toISOString(),
  });
}
