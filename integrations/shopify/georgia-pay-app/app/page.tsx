'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SettingsPage from '@/components/SettingsPage';
import { ShopifyAppBridge } from '@/components/shopify/ShopifyAppBridge';

export default function HomePage() {
  return (
    <AppProvider i18n={enTranslations}>
      <Suspense fallback={<p>Loading…</p>}>
        <HomeContent />
      </Suspense>
    </AppProvider>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  if (!shop) {
    return (
      <div style={{ padding: 24 }}>
        <h1>LariPay.ai — TBC &amp; BOG</h1>
        <p>Open this app from your Shopify admin after installation.</p>
      </div>
    );
  }

  return (
    <>
      <ShopifyAppBridge shop={shop} />
      <SettingsPage shop={shop} />
    </>
  );
}
