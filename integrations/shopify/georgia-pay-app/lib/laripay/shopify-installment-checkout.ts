import prisma from '@/lib/prisma';
import { createInstallmentCheckoutSession } from '@/lib/laripay/checkout';
import { getMerchantForShop } from '@/lib/laripay/provision-merchant';
import { getMerchantBankConfig } from '@/lib/laripay/merchant-config';
import type { ShopifyPaymentSessionBody } from '@/lib/payment-service';
import { getAppUrl } from '@/lib/shopify';

/**
 * Shopify installment checkout — redirect to bank-hosted pay-in-parts page.
 */
export async function startShopifyInstallmentCheckout(
  session: ShopifyPaymentSessionBody,
  shopDomain: string,
) {
  const merchant = await getMerchantForShop(shopDomain);
  if (!merchant) {
    throw new Error('LariPay merchant not linked for this shop');
  }

  const bankConfig = await getMerchantBankConfig(merchant.id);
  const provider = bankConfig.provider;

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });
  const installmentTerms = shop?.settings?.installmentTerms ?? undefined;

  const cancelUrl = session.payment_method?.data?.cancel_url || getAppUrl('/');
  const successUrl = getAppUrl(`/api/return?paymentId=${encodeURIComponent(session.id)}`);

  const checkout = await createInstallmentCheckoutSession(merchant, {
    amount: parseFloat(session.amount),
    currency: session.currency,
    provider,
    installmentTerms: installmentTerms ?? undefined,
    successUrl,
    cancelUrl,
    clientReferenceId: session.id,
    metadata: { shop: shopDomain, shopify_gid: session.gid, payment_mode: 'installment' },
  });

  const authExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const record = await prisma.paymentRecord.upsert({
    where: { shopifyPaymentId: session.id },
    create: {
      shopDomain,
      shopifyPaymentId: session.id,
      shopifyPaymentGid: session.gid,
      shopifyGroup: session.group,
      bank: provider,
      paymentMode: 'installment',
      installmentTerms: installmentTerms ?? null,
      bankReference: checkout.id,
      amount: session.amount,
      currency: session.currency,
      status: 'redirecting',
      cancelUrl,
      test: session.test,
      authorizationExpiresAt: authExpires,
      rawSession: JSON.stringify({ ...session, laripaySessionId: checkout.id }),
    },
    update: {
      status: 'redirecting',
      paymentMode: 'installment',
      bankReference: checkout.id,
      rawSession: JSON.stringify({ ...session, laripaySessionId: checkout.id }),
    },
  });

  return {
    redirect_url: checkout.url || getAppUrl(`/checkout/${record.id}`),
    recordId: record.id,
    laripaySessionId: checkout.id,
    platformFee: checkout.platform_fee,
  };
}
