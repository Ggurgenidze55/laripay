import prisma from '@/lib/prisma';

export const SERVICE_IDS = [
  'shopify',
  'woocommerce',
  'checkout_api',
  'delivery',
  'warehouse',
  'installments',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_LABELS: Record<ServiceId, { en: string; ka: string }> = {
  shopify: { en: 'Shopify Integration', ka: 'Shopify ინტეგრაცია' },
  woocommerce: { en: 'WooCommerce Integration', ka: 'WooCommerce ინტეგრაცია' },
  checkout_api: { en: 'Checkout API', ka: 'Checkout API' },
  delivery: { en: 'Delivery / Courier', ka: 'მიწოდება / კურიერი' },
  warehouse: { en: 'Warehouse Sync', ka: 'საწყობის სინქრონიზაცია' },
  installments: { en: 'Online Installments', ka: 'ონლაინ განვადება' },
};

export interface ServiceStatus {
  serviceId: ServiceId;
  label: { en: string; ka: string };
  enabled: boolean;
  active: boolean;
  paidUntil: Date | null;
  daysRemaining: number | null;
  suspended: boolean;
  priceGel: number;
  billingCycle: string;
}

export function isServiceActive(service: {
  enabled: boolean;
  paidUntil: Date | null;
  suspendedAt: Date | null;
}): boolean {
  if (!service.enabled) return false;
  if (service.suspendedAt) return false;
  if (service.paidUntil && service.paidUntil < new Date()) return false;
  return true;
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get all services for a merchant with their subscription status.
 */
export async function getMerchantServices(merchantId: string): Promise<ServiceStatus[]> {
  const records = await prisma.merchantService.findMany({
    where: { merchantId },
  });

  const byId = new Map(records.map((r) => [r.serviceId, r]));

  return SERVICE_IDS.map((sid) => {
    const record = byId.get(sid);
    if (!record) {
      return {
        serviceId: sid,
        label: SERVICE_LABELS[sid],
        enabled: false,
        active: false,
        paidUntil: null,
        daysRemaining: null,
        suspended: false,
        priceGel: 0,
        billingCycle: 'monthly',
      };
    }

    const active = isServiceActive(record);
    return {
      serviceId: sid,
      label: SERVICE_LABELS[sid],
      enabled: record.enabled,
      active,
      paidUntil: record.paidUntil,
      daysRemaining: daysUntil(record.paidUntil),
      suspended: Boolean(record.suspendedAt),
      priceGel: record.priceGel,
      billingCycle: record.billingCycle,
    };
  });
}

/**
 * Check if a specific service is active for a merchant.
 * Used as a gate before processing requests.
 */
export async function isServiceEnabled(
  merchantId: string,
  serviceId: ServiceId,
): Promise<boolean> {
  const record = await prisma.merchantService.findUnique({
    where: { merchantId_serviceId: { merchantId, serviceId } },
  });

  if (!record) return false;
  return isServiceActive(record);
}

/**
 * Activate a service for a merchant (on payment or manual).
 */
export async function activateService(
  merchantId: string,
  serviceId: ServiceId,
  opts: { paidUntil?: Date; priceGel?: number; billingCycle?: string } = {},
): Promise<void> {
  const paidUntil = opts.paidUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.merchantService.upsert({
    where: { merchantId_serviceId: { merchantId, serviceId } },
    create: {
      merchantId,
      serviceId,
      enabled: true,
      paidUntil,
      priceGel: opts.priceGel ?? 0,
      billingCycle: opts.billingCycle ?? 'monthly',
      activatedAt: new Date(),
    },
    update: {
      enabled: true,
      paidUntil,
      suspendedAt: null,
      ...(opts.priceGel != null ? { priceGel: opts.priceGel } : {}),
      ...(opts.billingCycle ? { billingCycle: opts.billingCycle } : {}),
    },
  });
}

/**
 * Suspend a service (non-payment or manual).
 */
export async function suspendService(
  merchantId: string,
  serviceId: ServiceId,
): Promise<void> {
  await prisma.merchantService.updateMany({
    where: { merchantId, serviceId },
    data: { suspendedAt: new Date(), enabled: false },
  });
}

/**
 * Suspend all expired services across all merchants.
 * Run this periodically (cron).
 */
export async function suspendExpiredServices(): Promise<number> {
  const now = new Date();
  const expired = await prisma.merchantService.findMany({
    where: {
      enabled: true,
      suspendedAt: null,
      paidUntil: { lt: now },
    },
  });

  if (expired.length === 0) return 0;

  await prisma.merchantService.updateMany({
    where: {
      id: { in: expired.map((e) => e.id) },
    },
    data: { enabled: false, suspendedAt: now },
  });

  console.log(`[service-gate] Suspended ${expired.length} expired service(s)`);
  return expired.length;
}
