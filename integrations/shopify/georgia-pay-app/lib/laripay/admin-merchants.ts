import prisma from '@/lib/prisma';
import { formatBpsAsPercent } from './billing';

export async function getAdminMerchantDetail(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      subscriptionPlan: true,
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          twoFactorRequired: true,
          createdAt: true,
        },
      },
      apiKeys: { orderBy: { createdAt: 'desc' } },
      webhookEndpoints: { orderBy: { createdAt: 'desc' } },
      paykaPayments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      checkoutSessions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      _count: {
        select: {
          paykaPayments: true,
          checkoutSessions: true,
          apiKeys: true,
          paykaRefunds: true,
        },
      },
    },
  });

  if (!merchant) return null;

  const succeeded = await prisma.paykaPayment.aggregate({
    where: { merchantId, status: 'succeeded' },
    _sum: { grossAmount: true, platformFee: true, netAmount: true },
    _count: true,
  });

  return {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    slug: merchant.slug,
    status: merchant.status,
    billing_mode: merchant.billingMode,
    commission_rate_bps: merchant.commissionRateBps,
    commission_percent: formatBpsAsPercent(merchant.commissionRateBps),
    default_provider: merchant.defaultProvider,
    subscription_plan: merchant.subscriptionPlan
      ? { code: merchant.subscriptionPlan.code, name: merchant.subscriptionPlan.name }
      : null,
    subscription_active_until: merchant.subscriptionActiveUntil,
    bank_config: {
      tbc_configured: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
      bog_configured: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
      has_tbc_api_key: Boolean(merchant.tbcApiKey),
      has_bog_callback_key: Boolean(merchant.bogCallbackPublicKey),
    },
    webhook_secret_prefix: merchant.webhookSecret.slice(0, 12) + '…',
    created_at: merchant.createdAt,
    updated_at: merchant.updatedAt,
    counts: merchant._count,
    stats: {
      payments_succeeded: succeeded._count,
      gross_volume: succeeded._sum.grossAmount ?? 0,
      platform_fees: succeeded._sum.platformFee ?? 0,
      net_volume: succeeded._sum.netAmount ?? 0,
    },
    owner: merchant.owner
      ? {
          id: merchant.owner.id,
          email: merchant.owner.email,
          name: merchant.owner.name,
          phone: merchant.owner.phone,
          role: merchant.owner.role,
          email_verified: Boolean(merchant.owner.emailVerifiedAt),
          phone_verified: Boolean(merchant.owner.phoneVerifiedAt),
          two_factor_required: merchant.owner.twoFactorRequired,
          created_at: merchant.owner.createdAt,
        }
      : null,
    api_keys: merchant.apiKeys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      mode: k.mode,
      name: k.name,
      last_used_at: k.lastUsedAt,
      revoked_at: k.revokedAt,
      created_at: k.createdAt,
      active: !k.revokedAt,
    })),
    webhooks: merchant.webhookEndpoints.map((w) => ({
      id: w.id,
      url: w.url,
      enabled: w.enabled,
      events: w.events,
      created_at: w.createdAt,
    })),
    payments: merchant.paykaPayments.map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      gross_amount: p.grossAmount,
      platform_fee: p.platformFee,
      net_amount: p.netAmount,
      fee_mode: p.feeMode,
      provider: p.provider,
      bank_reference: p.bankReference,
      client_reference_id: p.clientReferenceId,
      created_at: p.createdAt,
    })),
    checkout_sessions: merchant.checkoutSessions.map((s) => ({
      id: s.id,
      status: s.status,
      amount: s.amount,
      currency: s.currency,
      provider: s.provider,
      bank_reference: s.bankReference,
      redirect_url: s.redirectUrl ? '…' : null,
      expires_at: s.expiresAt,
      created_at: s.createdAt,
    })),
  };
}

export async function listAdminMerchants() {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, email: true, role: true } },
      subscriptionPlan: { select: { code: true } },
      _count: { select: { paykaPayments: true, apiKeys: true } },
      apiKeys: {
        where: { revokedAt: null },
        orderBy: { lastUsedAt: 'desc' },
        take: 1,
        select: { keyPrefix: true, mode: true, lastUsedAt: true },
      },
    },
  });

  return merchants.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    slug: m.slug,
    status: m.status,
    billing_mode: m.billingMode,
    commission_rate_bps: m.commissionRateBps,
    default_provider: m.defaultProvider,
    plan: m.subscriptionPlan?.code ?? null,
    payments_count: m._count.paykaPayments,
    api_keys_count: m._count.apiKeys,
    primary_api_key: m.apiKeys[0]
      ? { prefix: m.apiKeys[0].keyPrefix, mode: m.apiKeys[0].mode, last_used_at: m.apiKeys[0].lastUsedAt }
      : null,
    owner: m.owner ? { id: m.owner.id, email: m.owner.email, role: m.owner.role } : null,
    created_at: m.createdAt,
  }));
}

export async function listAdminUsers() {
  const users = await prisma.platformUser.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      merchant: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    merchant_id: u.merchantId,
    merchant: u.merchant
      ? { id: u.merchant.id, name: u.merchant.name, slug: u.merchant.slug, status: u.merchant.status }
      : null,
    email_verified: Boolean(u.emailVerifiedAt),
    phone_verified: Boolean(u.phoneVerifiedAt),
    created_at: u.createdAt,
  }));
}
