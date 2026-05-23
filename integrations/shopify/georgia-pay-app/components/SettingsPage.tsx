'use client';

import {
  Banner,
  BlockStack,
  Button,
  Card,
  FormLayout,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';
import { useCallback, useEffect, useState } from 'react';
import { getAppUrl } from '@/lib/shopify-client';

interface Settings {
  provider: string;
  testMode: boolean;
  laripayMerchantId?: string;
  tbcApiKey?: string;
  tbcClientId?: string;
  tbcClientSecret?: string;
  bogPublicKey?: string;
  bogSecretKey?: string;
  bogCallbackPublicKey?: string;
}

export default function SettingsPage({ shop }: { shop: string }) {
  const [settings, setSettings] = useState<Settings>({
    provider: 'tbc',
    testMode: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/settings?shop=${encodeURIComponent(shop)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            provider: data.settings.provider || 'tbc',
            testMode: data.settings.testMode !== false,
            laripayMerchantId: data.settings.laripayMerchantId || '',
            tbcApiKey: data.settings.tbcApiKey || '',
            tbcClientId: data.settings.tbcClientId || '',
            tbcClientSecret: data.settings.tbcClientSecret || '',
            bogPublicKey: data.settings.bogPublicKey || '',
            bogSecretKey: data.settings.bogSecretKey || '',
            bogCallbackPublicKey: data.settings.bogCallbackPublicKey || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [shop]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/settings?shop=${encodeURIComponent(shop)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      setMessage('Settings saved.');
    } else {
      setMessage('Failed to save settings.');
    }
  }, [shop, settings]);

  const appHost = typeof window !== 'undefined' ? window.location.origin : getAppUrl();

  if (loading) {
    return (
      <Page title="Georgia Pay">
        <Text as="p">Loading…</Text>
      </Page>
    );
  }

  return (
    <Page
      title="LariPay.ai — Georgia Pay"
      subtitle="Bank-hosted checkout only — customers pay on TBC/BOG pages. Configure your bank keys below."
      primaryAction={{ content: 'Save', onAction: save, loading: saving }}
    >
      <Layout>
        {message && (
          <Layout.Section>
            <Banner tone="success">{message}</Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                LariPay.ai API
              </Text>
              <Text as="p" tone="subdued">
                This shop is linked to a LariPay merchant on install. Checkout redirects to TBC/BOG — no card data on this app.
              </Text>
              {settings.laripayMerchantId ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  Merchant ID: {settings.laripayMerchantId}
                </Text>
              ) : null}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Environment
              </Text>
              <FormLayout>
                <Select
                  label="Mode"
                  options={[
                    { label: 'Sandbox (test)', value: 'sandbox' },
                    { label: 'Live (production)', value: 'live' },
                  ]}
                  value={settings.testMode ? 'sandbox' : 'live'}
                  onChange={(v) => setSettings((s) => ({ ...s, testMode: v === 'sandbox' }))}
                />
                <Select
                  label="Bank provider"
                  options={[
                    { label: 'TBC Pay', value: 'tbc' },
                    { label: 'BOG Pay', value: 'bog' },
                  ]}
                  value={settings.provider}
                  onChange={(v) => setSettings((s) => ({ ...s, provider: v }))}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                TBC Pay credentials
              </Text>
              <FormLayout>
                <TextField
                  label="API Key"
                  value={settings.tbcApiKey || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, tbcApiKey: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Client ID"
                  value={settings.tbcClientId || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, tbcClientId: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Client Secret"
                  type="password"
                  value={settings.tbcClientSecret || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, tbcClientSecret: v }))}
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                BOG Pay credentials
              </Text>
              <FormLayout>
                <TextField
                  label="Client ID (public key)"
                  value={settings.bogPublicKey || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, bogPublicKey: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Client Secret"
                  type="password"
                  value={settings.bogSecretKey || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, bogSecretKey: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Callback public key (PEM)"
                  value={settings.bogCallbackPublicKey || ''}
                  onChange={(v) => setSettings((s) => ({ ...s, bogCallbackPublicKey: v }))}
                  multiline={4}
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Webhook URLs
              </Text>
              <Text as="p" tone="subdued">
                Register at your bank merchant dashboard:
              </Text>
              <Text as="p" variant="bodySm">
                Return (LariPay.ai / demo): {appHost}/payment/return
              </Text>
              <Text as="p" variant="bodySm">
                Webhook (LariPay.ai / demo): {appHost}/api/webhook
              </Text>
              <Text as="p" variant="bodySm">
                Shopify TBC: {appHost}/api/webhooks/tbc
              </Text>
              <Text as="p" variant="bodySm">
                Shopify BOG: {appHost}/api/webhooks/bog
              </Text>
              <Button url={`https://${shop}/admin/settings/payments`} external>
                Open Shopify Payments settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
