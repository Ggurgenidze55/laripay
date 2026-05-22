import { NextRequest, NextResponse } from 'next/server';
import { buildPaymentsClient, type ShopBankConfig } from '@/lib/georgian-payments';
import { getLariPayReturnUrl, getLariPayWebhookUrl, isTbcSandbox } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const provider = body.provider === 'bog' ? 'bog' : 'tbc';
  const amount = Number(body.amount) || 1;
  const orderId = String(body.orderId || `demo-${Date.now()}`);

  const config: ShopBankConfig = {
    provider: provider as 'tbc' | 'bog',
    testMode: isTbcSandbox(),
    tbcApiKey: process.env.TBC_API_KEY,
    tbcClientId: process.env.TBC_CLIENT_ID,
    tbcClientSecret: process.env.TBC_CLIENT_SECRET,
    bogPublicKey: process.env.BOG_PUBLIC_KEY,
    bogSecretKey: process.env.BOG_SECRET_KEY,
    bogCallbackPublicKey: process.env.BOG_CALLBACK_PUBLIC_KEY,
  };

  if (provider === 'tbc' && (!config.tbcClientId || !config.tbcClientSecret)) {
    return NextResponse.json(
      { error: 'დაამატე TBC_CLIENT_ID და TBC_CLIENT_SECRET .env-ში' },
      { status: 422 },
    );
  }
  if (provider === 'bog' && (!config.bogPublicKey || !config.bogSecretKey)) {
    return NextResponse.json(
      { error: 'დაამატე BOG_PUBLIC_KEY და BOG_SECRET_KEY .env-ში' },
      { status: 422 },
    );
  }

  const returnUrl =
    getLariPayReturnUrl(orderId) ||
    `${process.env.HOST}/payment/return?paymentId=${encodeURIComponent(orderId)}`;
  const callbackUrl =
    getLariPayWebhookUrl(provider) ||
    `${process.env.HOST}/api/webhook`;

  try {
    const payments = buildPaymentsClient(config);
    const result = await payments.createPayment(amount, 'GEL', orderId, returnUrl, {
      provider,
      callbackUrl,
      successUrl: returnUrl,
      failUrl: returnUrl,
    });

    await prisma.paymentRecord.upsert({
      where: { shopifyPaymentId: orderId },
      create: {
        shopDomain: 'demo.laripay.ai',
        shopifyPaymentId: orderId,
        shopifyPaymentGid: `gid://laripay/Demo/${orderId}`,
        bank: provider,
        bankReference: result.paymentId || '',
        amount: String(amount),
        currency: 'GEL',
        status: 'redirecting',
        test: true,
      },
      update: {
        bankReference: result.paymentId || '',
        status: 'redirecting',
      },
    });

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      paymentId: result.paymentId,
      provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
