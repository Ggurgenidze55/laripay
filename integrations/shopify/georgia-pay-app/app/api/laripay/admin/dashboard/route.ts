import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getLariPayCoreBaseUrl } from '@/lib/laripay-core/proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { paykaPayments: true, apiKeys: true } },
      subscriptionPlan: true,
    },
  });

  const allSucceeded = await prisma.paykaPayment.findMany({
    where: { status: 'succeeded' },
  });

  const recentPayments = await prisma.paykaPayment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { merchant: { select: { slug: true, name: true } } },
  });

  const shops = await prisma.shop.count();
  const webhookEndpoints = await prisma.webhookEndpoint.count();
  const pendingSessions = await prisma.checkoutSession.count({
    where: { status: { in: ['open', 'pending'] } },
  });

  let coreStatus: Record<string, unknown> = { mode: 'legacy' };
  try {
    const base = getLariPayCoreBaseUrl();
    if (base) {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) });
      coreStatus = {
        mode: res.ok ? 'core' : 'core_unreachable',
        health: res.ok ? await res.json() : null,
        url: base,
      };
    }
  } catch {
    coreStatus = { mode: 'core_unreachable' };
  }

  return laripayJson({
    platform: {
      phase: 'production',
      core: coreStatus,
      shops_connected: shops,
      webhook_endpoints: webhookEndpoints,
      open_checkout_sessions: pendingSessions,
    },
    stats: {
      merchants_total: merchants.length,
      merchants_active: merchants.filter((m) => m.status === 'active').length,
      payments_succeeded: allSucceeded.length,
      gross_volume: allSucceeded.reduce((s, p) => s + p.grossAmount, 0),
      platform_fees: allSucceeded.reduce((s, p) => s + p.platformFee, 0),
      net_volume: allSucceeded.reduce((s, p) => s + p.netAmount, 0),
    },
    merchants: merchants.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      slug: m.slug,
      status: m.status,
      billing_mode: m.billingMode,
      plan: m.subscriptionPlan?.code || null,
      payments_count: m._count.paykaPayments,
      api_keys_count: m._count.apiKeys,
      created_at: m.createdAt,
    })),
    recent_payments: recentPayments.map((p) => ({
      id: p.id,
      merchant_slug: p.merchant.slug,
      merchant_name: p.merchant.name,
      status: p.status,
      amount: p.amount,
      provider: p.provider,
      platform_fee: p.platformFee,
      created_at: p.createdAt,
    })),
  });
}
