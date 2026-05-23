import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashApiKey } from './crypto';

export const INTEGRATION_PLATFORMS = [
  'shopify',
  'woocommerce',
  'wordpress',
  'api',
  'custom',
] as const;

export type IntegrationPlatformId = (typeof INTEGRATION_PLATFORMS)[number];

const PLATFORM_RANK: Record<IntegrationPlatformId, number> = {
  shopify: 40,
  woocommerce: 30,
  wordpress: 25,
  custom: 15,
  api: 5,
};

export type MerchantIntegrationInfo = {
  platform: IntegrationPlatformId;
  label: string;
  ref: string | null;
  inferred: boolean;
};

export function isIntegrationPlatformId(value: string): value is IntegrationPlatformId {
  return (INTEGRATION_PLATFORMS as readonly string[]).includes(value);
}

export function integrationPlatformLabel(
  platform: IntegrationPlatformId,
  locale: 'en' | 'ka' = 'en',
): string {
  const labels: Record<IntegrationPlatformId, { en: string; ka: string }> = {
    shopify: { en: 'Shopify', ka: 'Shopify' },
    woocommerce: { en: 'WooCommerce', ka: 'WooCommerce' },
    wordpress: { en: 'WordPress', ka: 'WordPress' },
    api: { en: 'Direct API', ka: 'პირდაპირი API' },
    custom: { en: 'Custom', ka: 'სხვა / Custom' },
  };
  return labels[platform][locale];
}

function formatInfo(
  platform: IntegrationPlatformId,
  ref: string | null,
  inferred: boolean,
  locale: 'en' | 'ka' = 'en',
): MerchantIntegrationInfo {
  const base = integrationPlatformLabel(platform, locale);
  let label = base;
  if (platform === 'shopify' && ref) {
    label = ref.includes('.myshopify.com') ? ref : `${ref}.myshopify.com`;
  } else if (ref && (platform === 'woocommerce' || platform === 'wordpress' || platform === 'custom')) {
    label = `${base} · ${ref}`;
  }
  return { platform, label, ref, inferred };
}

function parseMetadataIntegration(
  metadata: Record<string, unknown>,
): { platform: IntegrationPlatformId; ref: string | null } | null {
  const raw =
    metadata.integration ??
    metadata.platform ??
    metadata.source ??
    metadata.channel;
  if (typeof raw !== 'string') return null;
  const v = raw.toLowerCase();
  if (v.includes('shopify') || metadata.shop || metadata.shopify_shop) {
    const ref =
      typeof metadata.shop === 'string'
        ? metadata.shop
        : typeof metadata.shopify_shop === 'string'
          ? metadata.shopify_shop
          : null;
    return { platform: 'shopify', ref };
  }
  if (v.includes('woo')) return { platform: 'woocommerce', ref: pickRef(metadata) };
  if (v.includes('wordpress')) return { platform: 'wordpress', ref: pickRef(metadata) };
  if (isIntegrationPlatformId(v)) return { platform: v, ref: pickRef(metadata) };
  return null;
}

function pickRef(metadata: Record<string, unknown>): string | null {
  for (const key of ['site', 'site_url', 'store', 'store_url', 'domain']) {
    if (typeof metadata[key] === 'string' && metadata[key]) return metadata[key] as string;
  }
  return null;
}

export function parseIntegrationFromRequest(
  request: NextRequest,
  body?: Record<string, unknown>,
): { platform: IntegrationPlatformId; ref: string | null } | null {
  const header =
    request.headers.get('x-laripay-integration') ||
    request.headers.get('x-payka-integration');
  if (header) {
    const v = header.toLowerCase().trim();
    const ref =
      request.headers.get('x-laripay-integration-ref') ||
      request.headers.get('x-payka-integration-ref') ||
      null;
    if (v.includes('shopify')) return { platform: 'shopify', ref };
    if (v.includes('woo')) return { platform: 'woocommerce', ref };
    if (v.includes('wordpress')) return { platform: 'wordpress', ref };
    if (isIntegrationPlatformId(v)) return { platform: v, ref };
  }

  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (ua.includes('shopify')) return { platform: 'shopify', ref: null };
  if (ua.includes('woocommerce') || ua.includes('wordpress')) {
    return { platform: 'woocommerce', ref: null };
  }

  if (body?.metadata && typeof body.metadata === 'object') {
    return parseMetadataIntegration(body.metadata as Record<string, unknown>);
  }

  return null;
}

export async function setMerchantIntegration(
  merchantId: string,
  platform: IntegrationPlatformId,
  ref?: string | null,
  options?: { force?: boolean },
) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) return;

  const current = merchant.integrationPlatform as IntegrationPlatformId | null;
  if (current && !options?.force) {
    const curRank = PLATFORM_RANK[current] ?? 0;
    const nextRank = PLATFORM_RANK[platform] ?? 0;
    if (nextRank <= curRank) return;
  }

  await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      integrationPlatform: platform,
      integrationRef: ref?.trim() || merchant.integrationRef || null,
    },
  });
}

export async function recordIntegrationFromRequest(
  merchantId: string,
  request: NextRequest,
  body?: Record<string, unknown>,
) {
  const detected = parseIntegrationFromRequest(request, body);
  if (!detected) return;
  await setMerchantIntegration(merchantId, detected.platform, detected.ref);
}

async function inferIntegration(
  merchant: { id: string; slug: string; integrationRef: string | null },
): Promise<{ platform: IntegrationPlatformId; ref: string | null }> {
  const shopDomain = `${merchant.slug}.myshopify.com`;
  const shop = await prisma.shop.findFirst({
    where: { OR: [{ domain: shopDomain }, { domain: { contains: merchant.slug } }] },
    include: { settings: true },
    take: 1,
  });
  if (shop) {
    return { platform: 'shopify', ref: shop.domain };
  }

  const keys = await prisma.apiKey.findMany({
    where: { merchantId: merchant.id, revokedAt: null },
    select: { keyHash: true, name: true },
  });

  for (const key of keys) {
    const name = (key.name || '').toLowerCase();
    if (name.includes('shopify')) {
      const match = name.match(/shopify\s+(.+)/i);
      return { platform: 'shopify', ref: match?.[1]?.trim() || null };
    }
    if (name.includes('woo') || name.includes('wordpress')) {
      return { platform: 'woocommerce', ref: null };
    }
  }

  if (keys.length > 0) {
    const shops = await prisma.shop.findMany({ include: { settings: true } });
    for (const s of shops) {
      if (s.settings?.laripayMerchantId !== merchant.id) continue;
      return { platform: 'shopify', ref: s.domain };
    }
  }

  const sessions = await prisma.checkoutSession.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { metadata: true, successUrl: true },
  });

  for (const s of sessions) {
    if (s.successUrl?.includes('myshopify.com')) {
      try {
        const host = new URL(s.successUrl).hostname;
        return { platform: 'shopify', ref: host };
      } catch {
        return { platform: 'shopify', ref: null };
      }
    }
    if (!s.metadata) continue;
    try {
      const meta = JSON.parse(s.metadata) as Record<string, unknown>;
      const parsed = parseMetadataIntegration(meta);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  return { platform: 'api', ref: null };
}

export async function getMerchantIntegrationInfo(
  merchantId: string,
  locale: 'en' | 'ka' = 'en',
): Promise<MerchantIntegrationInfo> {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    return formatInfo('api', null, true, locale);
  }

  if (merchant.integrationPlatform && isIntegrationPlatformId(merchant.integrationPlatform)) {
    return formatInfo(
      merchant.integrationPlatform,
      merchant.integrationRef,
      false,
      locale,
    );
  }

  const inferred = await inferIntegration({
    id: merchant.id,
    slug: merchant.slug,
    integrationRef: merchant.integrationRef,
  });
  return formatInfo(inferred.platform, inferred.ref, true, locale);
}
