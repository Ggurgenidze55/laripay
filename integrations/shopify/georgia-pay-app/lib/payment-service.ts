import prisma from './prisma';
import { buildPaymentsClient, assertGelCurrency, type ShopBankConfig } from './georgian-payments';
import { getAppUrl } from './shopify';
import { isTbcSandbox, resolveReturnUrl, resolveWebhookUrl } from './laripay-env';
import { startShopifyLariPayCheckout } from './laripay/shopify-checkout';
import { getMerchantForShop } from './laripay/provision-merchant';
import {
  resolvePaymentSession,
  rejectPaymentSession,
  extractShopifyRedirectUrl,
} from './payments-api';
import type { GeorgianBankId } from './georgian-banks/registry';
import {
  isBankPaymentFailure,
  isBankPaymentSuccess,
} from './georgian-banks/payment-status';

export interface ShopifyPaymentSessionBody {
  id: string;
  gid: string;
  group?: string;
  amount: string;
  currency: string;
  test: boolean;
  kind: string;
  payment_method?: {
    type: string;
    data?: { cancel_url?: string };
  };
}

export async function getShopBankConfig(shopDomain: string): Promise<ShopBankConfig> {
  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });

  const s = shop?.settings;
  const provider = (s?.provider || process.env.DEFAULT_PAYMENT_PROVIDER || 'tbc') as 'tbc' | 'bog';

  return {
    provider,
    testMode: s?.testMode ?? isTbcSandbox(),
    tbcApiKey: s?.tbcApiKey,
    tbcClientId: s?.tbcClientId,
    tbcClientSecret: s?.tbcClientSecret,
    bogPublicKey: s?.bogPublicKey,
    bogSecretKey: s?.bogSecretKey,
    bogCallbackPublicKey: s?.bogCallbackPublicKey,
  };
}

export async function startCheckoutRedirect(session: ShopifyPaymentSessionBody, shopDomain: string) {
  assertGelCurrency(session.currency);

  const laripayMerchant = await getMerchantForShop(shopDomain);
  if (laripayMerchant) {
    return startShopifyLariPayCheckout(session, shopDomain);
  }

  const config = await getShopBankConfig(shopDomain);
  const payments = buildPaymentsClient(config);
  const cancelUrl = session.payment_method?.data?.cancel_url || getAppUrl('/');
  const returnUrl = resolveReturnUrl(
    session.id,
    getAppUrl(`/api/return?paymentId=${encodeURIComponent(session.id)}`),
  );
  const callbackUrl = resolveWebhookUrl(
    config.provider,
    getAppUrl(`/api/webhooks/${config.provider}`),
  );

  const authExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const record = await prisma.paymentRecord.upsert({
    where: { shopifyPaymentId: session.id },
    create: {
      shopDomain,
      shopifyPaymentId: session.id,
      shopifyPaymentGid: session.gid,
      shopifyGroup: session.group,
      bank: config.provider,
      amount: session.amount,
      currency: session.currency,
      status: 'pending',
      cancelUrl,
      test: session.test,
      authorizationExpiresAt: authExpires,
      rawSession: JSON.stringify(session),
    },
    update: {
      status: 'pending',
      rawSession: JSON.stringify(session),
    },
  });

  const result = await payments.createPayment(
    parseFloat(session.amount),
    session.currency,
    session.id,
    returnUrl,
    {
      provider: config.provider,
      callbackUrl,
      successUrl: returnUrl,
      failUrl: cancelUrl,
    },
  );

  await prisma.paymentRecord.update({
    where: { id: record.id },
    data: {
      bankReference: result.paymentId,
      status: 'redirecting',
    },
  });

  return {
    redirect_url: result.redirectUrl || getAppUrl(`/checkout/${record.id}`),
    recordId: record.id,
  };
}

export function isShopifyHostedPayment(shopDomain: string): boolean {
  return shopDomain.endsWith('.myshopify.com');
}

export async function finalizePaymentFromBank(
  shopifyPaymentId: string,
  bankStatus: string,
  bankReference: string,
): Promise<{ shopifyRedirectUrl?: string; status: string }> {
  const record = await prisma.paymentRecord.findUnique({
    where: { shopifyPaymentId },
  });

  if (!record) {
    throw new Error(`Payment record not found: ${shopifyPaymentId}`);
  }

  if (record.status === 'resolved') {
    return { status: 'resolved' };
  }

  const isSuccess = isBankPaymentSuccess(record.bank, bankStatus);

  const isFailure = isBankPaymentFailure(record.bank, bankStatus);

  const shopifyHosted = isShopifyHostedPayment(record.shopDomain);

  if (isSuccess) {
    let shopifyRedirectUrl: string | undefined;

    if (shopifyHosted) {
      const resolveResult = await resolvePaymentSession(
        record.shopDomain,
        record.shopifyPaymentGid,
        {
          authorizationExpiresAt: record.authorizationExpiresAt || undefined,
          networkTransactionId: bankReference,
        },
      );
      shopifyRedirectUrl = extractShopifyRedirectUrl(resolveResult) || undefined;
    }

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        status: 'resolved',
        bankReference,
        networkTransactionId: bankReference,
      },
    });

    return { shopifyRedirectUrl, status: 'resolved' };
  }

  if (isFailure) {
    if (shopifyHosted) {
      await rejectPaymentSession(
        record.shopDomain,
        record.shopifyPaymentGid,
        `Bank status: ${bankStatus}`,
      );
    }
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: { status: 'rejected', errorMessage: bankStatus },
    });
    return { status: 'rejected' };
  }

  await prisma.paymentRecord.update({
    where: { id: record.id },
    data: { status: 'processing' },
  });

  return { status: 'processing' };
}

export async function pollAndFinalize(shopifyPaymentId: string) {
  const record = await prisma.paymentRecord.findUnique({ where: { shopifyPaymentId } });
  if (!record?.bankReference) {
    throw new Error('Missing bank reference');
  }

  let laripaySessionId: string | null = null;
  if (record.rawSession) {
    try {
      const parsed = JSON.parse(record.rawSession) as { laripaySessionId?: string };
      laripaySessionId = parsed.laripaySessionId || null;
    } catch {
      laripaySessionId = null;
    }
  }

  const laripaySession = await prisma.checkoutSession.findFirst({
    where: {
      OR: [
        { id: laripaySessionId || record.bankReference },
        { clientReferenceId: shopifyPaymentId },
      ],
    },
  });

  if (laripaySession) {
    const { pollAndFinalizeLariPay } = await import('@/lib/laripay/finalize');
    const result = await pollAndFinalizeLariPay(laripaySession.id);
    return {
      status: result.status === 'complete' ? 'resolved' : result.status,
      shopifyRedirectUrl: result.redirectUrl,
    };
  }

  const config = await getShopBankConfig(record.shopDomain);
  const payments = buildPaymentsClient(config);
  const statusResult = await payments.checkStatus(
    record.bankReference,
    record.bank as GeorgianBankId,
  );

  return finalizePaymentFromBank(shopifyPaymentId, statusResult.status, record.bankReference);
}
