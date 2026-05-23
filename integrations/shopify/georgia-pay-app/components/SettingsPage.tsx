'use client';

import {
  Banner,
  BlockStack,
  Card,
  FormLayout,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAppUrl } from '@/lib/shopify-client';
import { GEORGIAN_BANKS, isRedirectBank } from '@/lib/georgian-banks/registry';
import type { BankCredentialsMap, GeorgianBankId } from '@/lib/georgian-banks/registry';

interface Settings {
  provider: string;
  testMode: boolean;
  laripayMerchantId?: string;
  installmentTerms?: number | null;
  tbcApiKey?: string;
  tbcClientId?: string;
  tbcClientSecret?: string;
  bogPublicKey?: string;
  bogSecretKey?: string;
  bogCallbackPublicKey?: string;
  bankCredentials?: BankCredentialsMap;
}

export default function SettingsPage({ shop }: { shop: string }) {
  const [settings, setSettings] = useState<Settings>({
    provider: 'tbc',
    testMode: true,
    bankCredentials: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const bankOptions = useMemo(
    () =>
      GEORGIAN_BANKS.map((b) => ({
        label: `${b.name}${b.status === 'beta' ? ' (beta)' : ''}`,
        value: b.id,
      })),
    [],
  );

  const selectedBank = (settings.provider || 'tbc') as GeorgianBankId;

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
            bankCredentials: data.settings.bankCredentials || {},
            installmentTerms: data.settings.installmentTerms ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [shop]);

  const updateRedirectCred = useCallback(
    (field: 'merchantId' | 'secretKey' | 'apiOrigin', value: string) => {
      setSettings((s) => ({
        ...s,
        bankCredentials: {
          ...s.bankCredentials,
          [selectedBank]: {
            ...s.bankCredentials?.[selectedBank],
            [field]: value,
          },
        },
      }));
    },
    [selectedBank],
  );

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
  const redirectCreds = settings.bankCredentials?.[selectedBank];

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
      subtitle="Bank-hosted card checkout — customers pay on the bank page (TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt)."
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
                One Shopify app supports all Georgian banks. Choose the default bank below; checkout redirects to the bank-hosted page.
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
                  label="Default bank provider"
                  options={bankOptions}
                  value={settings.provider}
                  onChange={(v) => setSettings((s) => ({ ...s, provider: v }))}
                />
                <Select
                  label="Default installment term (installments app)"
                  helpText="Optional. Leave empty so the customer chooses on the bank page."
                  options={[
                    { label: 'Customer chooses on bank page', value: '' },
                    { label: '3 months', value: '3' },
                    { label: '6 months', value: '6' },
                    { label: '12 months', value: '12' },
                    { label: '24 months', value: '24' },
                    { label: '36 months', value: '36' },
                  ]}
                  value={settings.installmentTerms ? String(settings.installmentTerms) : ''}
                  onChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      installmentTerms: v ? Number(v) : null,
                    }))
                  }
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        {selectedBank === 'tbc' && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  TBC Pay credentials
                </Text>
                <FormLayout>
                  <TextField label="API Key" value={settings.tbcApiKey || ''} onChange={(v) => setSettings((s) => ({ ...s, tbcApiKey: v }))} autoComplete="off" />
                  <TextField label="Client ID" value={settings.tbcClientId || ''} onChange={(v) => setSettings((s) => ({ ...s, tbcClientId: v }))} autoComplete="off" />
                  <TextField label="Client Secret" type="password" value={settings.tbcClientSecret || ''} onChange={(v) => setSettings((s) => ({ ...s, tbcClientSecret: v }))} autoComplete="off" />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {selectedBank === 'bog' && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  BOG Pay credentials
                </Text>
                <FormLayout>
                  <TextField label="Client ID (public key)" value={settings.bogPublicKey || ''} onChange={(v) => setSettings((s) => ({ ...s, bogPublicKey: v }))} autoComplete="off" />
                  <TextField label="Client Secret" type="password" value={settings.bogSecretKey || ''} onChange={(v) => setSettings((s) => ({ ...s, bogSecretKey: v }))} autoComplete="off" />
                  <TextField label="Callback public key (PEM)" value={settings.bogCallbackPublicKey || ''} onChange={(v) => setSettings((s) => ({ ...s, bogCallbackPublicKey: v }))} multiline={4} autoComplete="off" />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {isRedirectBank(selectedBank) && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {GEORGIAN_BANKS.find((b) => b.id === selectedBank)?.name} credentials
                </Text>
                <Text as="p" tone="subdued">
                  Merchant keys from your bank dashboard. Checkout stays on the bank-hosted page (3DS / card entry).
                </Text>
                <FormLayout>
                  <TextField label="API origin" value={redirectCreds?.apiOrigin || ''} onChange={(v) => updateRedirectCred('apiOrigin', v)} autoComplete="off" />
                  <TextField label="Merchant ID" value={redirectCreds?.merchantId || ''} onChange={(v) => updateRedirectCred('merchantId', v)} autoComplete="off" />
                  <TextField label="Secret key" type="password" value={redirectCreds?.secretKey || ''} onChange={(v) => updateRedirectCred('secretKey', v)} autoComplete="off" />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

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
                Return (LariPay.ai): {appHost}/payment/return
              </Text>
              <Text as="p" variant="bodySm">
                Webhook (LariPay.ai): {appHost}/api/webhook
              </Text>
              <Text as="p" variant="bodySm">
                Shopify TBC: {appHost}/api/webhooks/tbc
              </Text>
              <Text as="p" variant="bodySm">
                Shopify BOG: {appHost}/api/webhooks/bog
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
