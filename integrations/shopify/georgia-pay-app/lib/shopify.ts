import '@shopify/shopify-api/adapters/web-api';
import { shopifyApi, ApiVersion, Session, Shopify } from '@shopify/shopify-api';
import prisma from './prisma';

let shopifyInstance: Shopify | null = null;

function parseScopes(): string[] {
  const raw = process.env.SCOPES?.trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function getShopify(): Shopify {
  if (shopifyInstance) return shopifyInstance;

  const apiKey = process.env.SHOPIFY_API_KEY || 'build-placeholder';
  const apiSecret = process.env.SHOPIFY_API_SECRET || 'build-placeholder';
  const hostName = (process.env.HOST || 'http://localhost:3000').replace(/^https?:\/\//, '');

  shopifyInstance = shopifyApi({
    apiKey,
    apiSecretKey: apiSecret,
    scopes: parseScopes(),
    hostName,
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: false,
  });

  return shopifyInstance;
}

export const shopify = new Proxy({} as Shopify, {
  get(_target, prop) {
    return Reflect.get(getShopify(), prop);
  },
});

export async function getShopSession(domain: string): Promise<Session | null> {
  const shop = await prisma.shop.findUnique({ where: { domain } });
  if (!shop) return null;

  return new Session({
    id: `offline_${domain}`,
    shop: domain,
    state: 'offline',
    isOnline: false,
    accessToken: shop.accessToken,
  });
}

export async function saveShopSession(domain: string, accessToken: string) {
  return prisma.shop.upsert({
    where: { domain },
    create: { domain, accessToken },
    update: { accessToken },
  });
}

export function getAppUrl(path = '') {
  const base = process.env.HOST || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
