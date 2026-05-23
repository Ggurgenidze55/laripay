import prisma from '@/lib/prisma';
import { createMerchant } from '@/lib/laripay/onboard';
import { generateSecretKey, hashApiKey } from '@/lib/laripay/crypto';
import { setMerchantIntegration } from '@/lib/laripay/integration-platform';
import type { AuthenticatedMerchant } from '@/lib/laripay/auth';

function toAuthMerchant(m: {
  id: string;
  slug: string;
  email: string;
  billingMode: string;
  commissionRateBps: number;
  subscriptionActiveUntil: Date | null;
  defaultProvider: string;
  webhookSecret: string;
}): AuthenticatedMerchant {
  return {
    id: m.id,
    slug: m.slug,
    email: m.email,
    billingMode: m.billingMode,
    commissionRateBps: m.commissionRateBps,
    subscriptionActiveUntil: m.subscriptionActiveUntil,
    defaultProvider: m.defaultProvider,
    webhookSecret: m.webhookSecret,
  };
}

/**
 * Ensure each Shopify shop is linked to a LariPay merchant (no API secrets stored on ShopSettings).
 */
export async function ensureLariPayMerchantForShop(shopDomain: string): Promise<string | null> {
  const slug = shopDomain.replace(/\.myshopify\.com$/i, '').toLowerCase() || shopDomain;

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });

  if (!shop) return null;

  if (shop.settings?.laripayMerchantId) {
    return shop.settings.laripayMerchantId;
  }

  let merchant = await prisma.merchant.findUnique({ where: { slug } });

  if (!merchant) {
    try {
      const created = await createMerchant({
        name: shopDomain,
        email: `shop@${slug}.laripay.ai`,
        slug,
        billingMode: 'COMMISSION',
        integrationPlatform: 'shopify',
        integrationRef: shopDomain,
      });
      merchant = created.merchant;

      await prisma.shopSettings.upsert({
        where: { shopId: shop.id },
        create: {
          shopId: shop.id,
          laripayMerchantId: merchant.id,
          provider: 'tbc',
          testMode: true,
        },
        update: { laripayMerchantId: merchant.id },
      });

      return merchant.id;
    } catch {
      merchant = await prisma.merchant.findUnique({ where: { slug } });
    }
  }

  if (!merchant) return null;

  await setMerchantIntegration(merchant.id, 'shopify', shopDomain, { force: true });

  const secretKey = generateSecretKey('test');
  await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyPrefix: secretKey.slice(0, 16),
      keyHash: hashApiKey(secretKey),
      mode: 'test',
      name: `Shopify ${shopDomain}`,
    },
  });

  await prisma.shopSettings.upsert({
    where: { shopId: shop.id },
    create: {
      shopId: shop.id,
      laripayMerchantId: merchant.id,
      provider: 'tbc',
      testMode: true,
    },
    update: { laripayMerchantId: merchant.id },
  });

  return merchant.id;
}

export async function getMerchantForShop(shopDomain: string): Promise<AuthenticatedMerchant | null> {
  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });

  const merchantId =
    shop?.settings?.laripayMerchantId || (await ensureLariPayMerchantForShop(shopDomain));

  if (!merchantId) return null;

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  return merchant ? toAuthMerchant(merchant) : null;
}
