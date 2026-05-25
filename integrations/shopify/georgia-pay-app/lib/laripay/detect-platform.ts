import type { IntegrationPlatformId } from './integration-platform';

export type DetectionResult = {
  platform: IntegrationPlatformId;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  siteUrl: string;
};

const SHOPIFY_SIGNALS = [
  'cdn.shopify.com',
  'myshopify.com',
  'Shopify.theme',
  'shopify-section',
  'shopify-features',
];

const WOO_SIGNALS = [
  'woocommerce',
  'wc-ajax',
  'wp-content',
  'wp-includes',
  'WooCommerce',
  'wc_add_to_cart',
];

const WORDPRESS_SIGNALS = [
  'wp-content',
  'wp-includes',
  'wp-json',
  'wordpress',
  'generator" content="WordPress',
];

const CSCART_SIGNALS = ['cs-cart', 'cscart', 'fn_url', 'dispatch['];
const OPENCART_SIGNALS = ['opencart', 'route=common', 'catalog/view'];
const PRESTASHOP_SIGNALS = ['prestashop', 'PrestaShop', 'modules/'];
const MAGENTO_SIGNALS = ['magento', 'Magento', 'mage/'];

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

function countSignals(html: string, signals: string[]): string[] {
  return signals.filter((s) => html.includes(s));
}

export async function detectPlatform(rawUrl: string): Promise<DetectionResult> {
  const siteUrl = normalizeUrl(rawUrl);

  const domain = (() => {
    try {
      return new URL(siteUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  if (domain.endsWith('.myshopify.com') || domain.includes('shopify')) {
    return {
      platform: 'shopify',
      confidence: 'high',
      signals: ['domain contains myshopify.com'],
      siteUrl,
    };
  }

  let html = '';
  let headers: Record<string, string> = {};
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(siteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LariPay-PlatformDetector/1.0',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    headers = Object.fromEntries(
      [...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]),
    );

    html = await res.text();
    if (html.length > 500_000) {
      html = html.slice(0, 500_000);
    }
  } catch (err) {
    console.warn(`[detect-platform] fetch failed for ${siteUrl}:`, err);
    return {
      platform: 'custom',
      confidence: 'low',
      signals: ['site unreachable'],
      siteUrl,
    };
  }

  const xPoweredBy = headers['x-powered-by'] || '';
  const server = headers['server'] || '';
  const xShopifyStage = headers['x-shopify-stage'] || '';

  if (xShopifyStage || headers['x-shopid']) {
    return {
      platform: 'shopify',
      confidence: 'high',
      signals: ['Shopify response headers'],
      siteUrl,
    };
  }

  const shopifyHits = countSignals(html, SHOPIFY_SIGNALS);
  const wooHits = countSignals(html, WOO_SIGNALS);
  const wpHits = countSignals(html, WORDPRESS_SIGNALS);
  const cscartHits = countSignals(html, CSCART_SIGNALS);
  const opencartHits = countSignals(html, OPENCART_SIGNALS);
  const prestaHits = countSignals(html, PRESTASHOP_SIGNALS);
  const magentoHits = countSignals(html, MAGENTO_SIGNALS);

  type Candidate = { platform: IntegrationPlatformId; hits: string[]; weight: number };
  const candidates: Candidate[] = [
    { platform: 'shopify', hits: shopifyHits, weight: shopifyHits.length * 3 },
    { platform: 'woocommerce', hits: wooHits, weight: wooHits.length * 2 },
    { platform: 'wordpress', hits: wpHits, weight: wpHits.length },
    { platform: 'cscart', hits: cscartHits, weight: cscartHits.length * 2 },
    { platform: 'opencart', hits: opencartHits, weight: opencartHits.length * 2 },
    { platform: 'prestashop', hits: prestaHits, weight: prestaHits.length * 2 },
    { platform: 'magento', hits: magentoHits, weight: magentoHits.length * 2 },
  ];

  if (xPoweredBy.toLowerCase().includes('shopify')) {
    const c = candidates.find((c) => c.platform === 'shopify')!;
    c.weight += 5;
    c.hits.push('x-powered-by: Shopify');
  }

  candidates.sort((a, b) => b.weight - a.weight);
  const best = candidates[0];

  if (best.weight === 0) {
    return {
      platform: 'custom',
      confidence: 'low',
      signals: ['no known CMS/platform markers found'],
      siteUrl,
    };
  }

  if (best.platform === 'wordpress' && wooHits.length >= 2) {
    return {
      platform: 'woocommerce',
      confidence: wooHits.length >= 3 ? 'high' : 'medium',
      signals: [...wooHits, ...wpHits],
      siteUrl,
    };
  }

  const confidence: DetectionResult['confidence'] =
    best.weight >= 6 ? 'high' : best.weight >= 3 ? 'medium' : 'low';

  return {
    platform: best.platform,
    confidence,
    signals: best.hits,
    siteUrl,
  };
}
