import { platformEnv } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';
import { createMerchant } from '@/lib/laripay/onboard';
import { generateSecretKey, hashApiKey } from '@/lib/laripay/crypto';
import { setMerchantIntegration } from '@/lib/laripay/integration-platform';

/**
 * Ensure each Shopify shop has a LariPay.ai merchant + API key stored in settings.
 */
export async function ensureLariPayMerchantForShop(shopDomain: string): Promise<string | null> {
  const slug = shopDomain.replace(/\.myshopify\.com$/i, '').toLowerCase() || shopDomain;

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });

  if (!shop) return null;

  if (shop.settings?.paykaApiKey) {
    return shop.settings.paykaApiKey;
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
      const apiKey = created.secretKey;

      await prisma.shopSettings.upsert({
        where: { shopId: shop.id },
        create: {
          shopId: shop.id,
          paykaApiKey: apiKey,
          provider: 'tbc',
          testMode: true,
        },
        update: { paykaApiKey: apiKey },
      });

      return apiKey;
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
      paykaApiKey: secretKey,
      provider: 'tbc',
      testMode: true,
    },
    update: { paykaApiKey: secretKey },
  });

  return secretKey;
}

export async function getLariPayApiKeyForShop(shopDomain: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    include: { settings: true },
  });

  if (shop?.settings?.paykaApiKey) {
    return shop.settings.paykaApiKey;
  }

  return (
    platformEnv('DEMO_API_KEY') ||
    (await ensureLariPayMerchantForShop(shopDomain))
  );
}
