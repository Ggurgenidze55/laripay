import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import prisma from '@/lib/prisma';
import { ensureLariPaySeed } from '@/lib/laripay/seed';
import { isSubscriptionActive } from '@/lib/laripay/billing';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError } from '@/lib/laripay/api-response';
import { getMerchantIntegrationInfo } from '@/lib/laripay/integration-platform';
import { buildMerchantServices } from '@/lib/laripay/merchant-services';
import { buildMerchantReadiness } from '@/lib/laripay/merchant-readiness';
import { isTransientDbError, transientDbMessage } from '@/lib/laripay/db-errors';
import { ensureDatabaseReady, withDbRetry } from '@/lib/laripay/with-db-retry';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatePortalRequest(request);
    if ('error' in auth) {
      return laripayError(auth.error, auth.status, 'authentication_error');
    }

    await ensureDatabaseReady();
    await withDbRetry(() => ensureLariPaySeed());

    return buildDashboardResponse(auth.merchantId);
  } catch (err) {
    console.error('[laripay/dashboard]', err);
    if (isTransientDbError(err)) {
      return laripayError(transientDbMessage(), 503, 'database_unavailable');
    }
    const message =
      err instanceof Error ? err.message : 'Dashboard unavailable';
    return laripayError(message, 500, 'internal_error');
  }
}

async function buildDashboardResponse(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { subscriptionPlan: true },
  });

  if (!merchant) {
    return laripayError('Merchant not found', 404);
  }

  const succeeded = await prisma.paykaPayment.findMany({
    where: { merchantId: merchant.id, status: 'succeeded' },
  });

  const recentPayments = await prisma.paykaPayment.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  const recentRefunds = await prisma.paykaRefund.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const refundCount = await prisma.paykaRefund.count({
    where: { merchantId: merchant.id, status: 'succeeded' },
  });

  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true } });

  const apiKeys = await prisma.apiKey.findMany({
    where: { merchantId: merchant.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const integration = await getMerchantIntegrationInfo(merchant.id);
  const services = await buildMerchantServices(merchant);
  const webhookCount = await prisma.webhookEndpoint.count({
    where: { merchantId: merchant.id, enabled: true },
  });

  const bankConfigured = {
    tbc: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
    bog: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
  };

  const shopifyManualSessions = await prisma.checkoutSession.findMany({
    where: {
      merchantId: merchant.id,
      clientReferenceId: { startsWith: 'shopify_order_' },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { paykaPayment: true },
  });

  const readiness = buildMerchantReadiness({
    integration_platform: merchant.integrationPlatform,
    bank_configured: bankConfigured,
    api_keys: apiKeys,
    webhook_count: webhookCount,
    payments_succeeded: succeeded.length,
  });

  return NextResponse.json({
    merchant: {
      id: merchant.id,
      slug: merchant.slug,
      email: merchant.email,
      billing_mode: merchant.billingMode,
      commission_rate_bps: merchant.commissionRateBps,
      subscription_active: isSubscriptionActive(merchant),
      subscription_plan: merchant.subscriptionPlan?.code || null,
      default_provider: merchant.defaultProvider,
      bank_configured: bankConfigured,
      integration: {
        platform: integration.platform,
        label: integration.label,
        ref: integration.ref,
        inferred: integration.inferred,
      },
    },
    stats: {
      payments_succeeded: succeeded.length,
      refunds_succeeded: refundCount,
      gross_volume: succeeded.reduce((s, p) => s + p.grossAmount, 0),
      platform_fees: succeeded.reduce((s, p) => s + p.platformFee, 0),
      net_volume: succeeded.reduce((s, p) => s + p.netAmount, 0),
    },
    recent_payments: recentPayments.map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      platform_fee: p.platformFee,
      provider: p.provider,
      created: p.createdAt,
    })),
    recent_refunds: recentRefunds.map((r) => ({
      id: r.id,
      payment_id: r.paymentId,
      status: r.status,
      amount: r.amount,
      created: r.createdAt,
    })),
    api_keys: apiKeys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      mode: k.mode,
      name: k.name,
      last_used_at: k.lastUsedAt,
    })),
    plans,
    services: services.map((s) => ({
      id: s.id,
      enabled: s.enabled,
      region: s.region,
      ...(s.integrationPlatform ? { integration_platform: s.integrationPlatform } : {}),
    })),
    shopify_orders: shopifyManualSessions.map((s) => {
      const meta = s.metadata ? JSON.parse(s.metadata) : {};
      return {
        id: s.id,
        shopify_order_name: meta.shopify_order_name || null,
        shopify_order_id: meta.shopify_order_id || null,
        shop_domain: meta.shop_domain || null,
        customer_email: meta.customer_email || null,
        amount: s.amount,
        currency: s.currency,
        status: s.status,
        payment_status: s.paykaPayment?.status || null,
        payment_url: s.redirectUrl,
        created: s.createdAt,
      };
    }),
    readiness,
    phase: 2,
  });
}
