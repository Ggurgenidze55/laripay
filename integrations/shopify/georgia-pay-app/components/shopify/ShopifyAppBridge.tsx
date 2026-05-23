'use client';

import { useEffect } from 'react';

/** Load App Bridge only inside Shopify Admin iframe (never on marketing / laripay pages). */
export function ShopifyAppBridge({ shop }: { shop: string }) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY?.trim();

  useEffect(() => {
    if (!shop || !apiKey) return;

    let embedded = false;
    try {
      embedded = window.top !== window.self;
    } catch {
      embedded = true;
    }
    if (!embedded) return;

    if (document.querySelector('script[data-laripay-app-bridge]')) return;

    let meta = document.querySelector('meta[name="shopify-api-key"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'shopify-api-key');
      document.head.prepend(meta);
    }
    meta.setAttribute('content', apiKey);

    const script = document.createElement('script');
    script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
    script.setAttribute('data-laripay-app-bridge', '1');
    document.head.prepend(script);
  }, [shop, apiKey]);

  return null;
}
