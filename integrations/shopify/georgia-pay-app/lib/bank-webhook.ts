import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyWebhook } = require('@georgian-payments');
import { getShopBankConfig } from '@/lib/payment-service';
import { finalizePaymentByReference } from '@/lib/laripay/finalize';
import { buildPaymentsClient } from '@/lib/georgian-payments';
import { isTbcSandbox } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';

export async function handleBankWebhook(
  request: NextRequest,
  provider: 'tbc' | 'bog',
  rawBody?: string,
) {
  const body = rawBody ?? (await request.text());

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';

  let signature = '';
  if (provider === 'tbc') {
    signature =
      request.headers.get('x-tbc-signature') ||
      request.headers.get('callback-signature') ||
      request.headers.get('x-signature') ||
      '';
  } else {
    signature = request.headers.get('callback-signature') || '';
  }

  let shopifyPaymentId = '';
  let bankReference = '';
  let shopDomain = '';

  const payload = JSON.parse(body || '{}');
  if (provider === 'tbc') {
    bankReference = payload.PaymentId || payload.paymentId || payload.payId || '';
    const laripaySession = bankReference
      ? await prisma.checkoutSession.findFirst({ where: { bankReference } })
      : null;
    const record = bankReference
      ? await prisma.paymentRecord.findFirst({ where: { bankReference } })
      : null;
    shopifyPaymentId =
      laripaySession?.id ||
      record?.shopifyPaymentId ||
      payload.merchantPaymentId ||
      '';
    shopDomain = record?.shopDomain || '';
  } else {
    const bogBody = payload.body || payload;
    shopifyPaymentId = bogBody.external_order_id || '';
    bankReference = bogBody.order_id || '';
    const laripaySession = shopifyPaymentId
      ? await prisma.checkoutSession.findUnique({ where: { id: shopifyPaymentId } })
      : null;
    const record = shopifyPaymentId
      ? await prisma.paymentRecord.findUnique({ where: { shopifyPaymentId } })
      : null;
    if (laripaySession) shopifyPaymentId = laripaySession.id;
    shopDomain = record?.shopDomain || '';
  }

  const config = shopDomain
    ? await getShopBankConfig(shopDomain)
    : {
        provider,
        testMode: isTbcSandbox(),
        tbcClientSecret: process.env.TBC_CLIENT_SECRET,
        bogCallbackPublicKey: process.env.BOG_CALLBACK_PUBLIC_KEY,
      };

  const verifyResult = verifyWebhook(provider, body, signature, {
    secret: config.tbcClientSecret || process.env.TBC_CLIENT_SECRET,
    publicKey: config.bogCallbackPublicKey || process.env.BOG_CALLBACK_PUBLIC_KEY,
    clientIp: provider === 'tbc' ? clientIp : undefined,
    skipIpCheck: isTbcSandbox() || process.env.NODE_ENV === 'development',
  });

  if (!verifyResult.valid) {
    return NextResponse.json({ error: verifyResult.error }, { status: 401 });
  }

  if (!shopifyPaymentId && verifyResult.paymentId) {
    const laripaySession = await prisma.checkoutSession.findFirst({
      where: { bankReference: verifyResult.paymentId },
    });
    const record = await prisma.paymentRecord.findFirst({
      where: { bankReference: verifyResult.paymentId },
    });
    shopifyPaymentId =
      laripaySession?.id || record?.shopifyPaymentId || verifyResult.paymentId;
    shopDomain = record?.shopDomain || shopDomain;
  }

  let bankStatus = '';
  const payments = buildPaymentsClient(
    shopDomain ? await getShopBankConfig(shopDomain) : (config as Awaited<ReturnType<typeof getShopBankConfig>>),
  );

  if (provider === 'tbc') {
    bankReference = verifyResult.paymentId || bankReference;
    const status = await payments.checkStatus(bankReference, 'tbc');
    bankStatus = status.status;
    if (!shopifyPaymentId) {
      shopifyPaymentId = status.raw?.merchantPaymentId || bankReference;
    }
  } else {
    const bogBody = verifyResult.payload?.body || verifyResult.payload || {};
    bankReference = bogBody.order_id || verifyResult.orderId || bankReference;
    bankStatus = bogBody.order_status?.key || '';
    if (!bankStatus && bankReference) {
      const status = await payments.checkStatus(bankReference, 'bog');
      bankStatus = status.status;
    }
    if (!shopifyPaymentId) {
      shopifyPaymentId = bogBody.external_order_id || '';
    }
  }

  if (!shopifyPaymentId) {
    return NextResponse.json({ error: 'Could not map webhook to payment' }, { status: 422 });
  }

  await finalizePaymentByReference(shopifyPaymentId, bankStatus, bankReference);

  return NextResponse.json({ ok: true }, { status: 200 });
}
