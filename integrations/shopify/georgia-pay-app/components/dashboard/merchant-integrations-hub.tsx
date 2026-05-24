'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { IntegrationPlatformBadge } from '@/components/laripay/integration-platform-badge';
import { parseApiJson } from '@/lib/parse-api-json';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

type HubData = {
  api_base_url: string;
  merchant: {
    slug: string;
    integration: {
      platform: IntegrationPlatformId;
      label: string;
      ref: string | null;
      inferred: boolean;
    };
    bank_configured: { tbc: boolean; bog: boolean };
    default_provider: string;
  };
  api_keys: { id: string; prefix: string; mode: string; name: string | null }[];
  webhooks: { id: string; url: string; enabled: boolean; events: string }[];
  platforms: {
    id: IntegrationPlatformId;
    status: string;
    active: boolean;
    ready: boolean;
    plugin_downloads: string[];
    docs_path: string;
  }[];
  shopify_app_url: string;
};

type Props = {
  initialPlatform?: IntegrationPlatformId;
};

export function MerchantIntegrationsHub({ initialPlatform }: Props) {
  const { t, route, locale } = useLocale();
  const h = t.dashboard.integrationsHub;
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<IntegrationPlatformId>(
    initialPlatform || 'woocommerce',
  );
  const [storeRef, setStoreRef] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/laripay/merchant/integrations', { credentials: 'include' });
    const { data: payload } = await parseApiJson<HubData & { error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok || !payload) {
      setError(payload?.error?.message || h.loadError);
      return;
    }
    setData(payload as HubData);
    setSelected(payload.merchant.integration.platform || 'api');
    setStoreRef(payload.merchant.integration.ref || '');
  }, [h.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const platformMeta = useMemo(() => {
    if (!data) return null;
    return data.platforms.find((p) => p.id === selected);
  }, [data, selected]);

  const steps = (h.platforms as Record<string, { steps: string[] }>)[selected]?.steps ?? [];

  async function savePlatform() {
    if (!data) return;
    setBusy(true);
    setMessage('');
    const res = await fetch('/api/laripay/merchant/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ integration_platform: selected, integration_ref: storeRef || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const { data: err } = await parseApiJson<{ error?: { message?: string } }>(res);
      setMessage(err?.error?.message || h.saveFailed);
      return;
    }
    setMessage(h.saved);
    await load();
  }

  async function createKey(mode: 'test' | 'live') {
    setBusy(true);
    setMessage('');
    const res = await fetch('/api/laripay/merchant/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mode, name: `${selected}-${mode}` }),
    });
    const { data: payload } = await parseApiJson<{ api_key?: string; error?: { message?: string } }>(res);
    setBusy(false);
    if (!res.ok) {
      setMessage(payload?.error?.message || h.keyFailed);
      return;
    }
    if (payload?.api_key) setNewApiKey(payload.api_key);
    setMessage(h.keyCreated);
    await load();
  }

  async function addWebhook() {
    if (!webhookUrl.trim()) return;
    setBusy(true);
    const res = await fetch('/api/laripay/merchant/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        url: webhookUrl.trim(),
        events: ['payment.succeeded', 'payment.failed', 'checkout.session.completed'],
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const { data: err } = await parseApiJson<{ error?: { message?: string } }>(res);
      setMessage(err?.error?.message || h.webhookFailed);
      return;
    }
    setWebhookUrl('');
    setMessage(h.webhookAdded);
    await load();
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
    setMessage(h.copied);
  }

  async function downloadPlugin(pluginId: string) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/laripay/merchant/integrations/download/${pluginId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluginId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(h.downloaded);
    } catch {
      setMessage(h.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[#71717a]">{h.loading}</p>;
  }

  if (error || !data) {
    return <p className="py-8 text-center text-sm text-red-300">{error || h.loadError}</p>;
  }

  const apiUrl = data.api_base_url;
  const testKey = data.api_keys.find((k) => k.mode === 'test');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#52525b]">{h.eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{h.title}</h2>
          <p className="mt-1 max-w-xl text-sm text-[#71717a]">{h.subtitle}</p>
        </div>
        <IntegrationPlatformBadge
          platform={data.merchant.integration.platform}
          label={data.merchant.integration.label}
          inferred={data.merchant.integration.inferred}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          {data.platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                selected === p.id
                  ? 'bg-[#8b5cf6]/15 text-[#e9d5ff] ring-1 ring-[#8b5cf6]/25'
                  : 'text-[#71717a] hover:bg-white/[0.03] hover:text-white',
              )}
            >
              <span>{(h.platformNames as Record<string, string>)[p.id] || p.id}</span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  p.ready ? 'bg-[#4ade80] shadow-[0_0_6px_#4ade80]' : 'bg-[#52525b]',
                )}
              />
            </button>
          ))}
        </aside>

        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-xl border border-white/[0.08] bg-[#13111a] p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                {(h.platformNames as Record<string, string>)[selected]}
              </h3>
              <p className="text-xs text-[#71717a]">
                {platformMeta?.status === 'available' ? h.statusAvailable : h.statusBeta}
                {platformMeta?.active ? ` · ${h.statusActive}` : ''}
              </p>
            </div>
            {platformMeta?.plugin_downloads?.length ? (
              <div className="flex flex-wrap gap-2">
                {platformMeta.plugin_downloads.map((pluginId) => (
                  <button
                    key={pluginId}
                    type="button"
                    disabled={busy}
                    onClick={() => downloadPlugin(pluginId)}
                    className="rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-1.5 text-xs font-medium text-[#c4b5fd] hover:bg-[#8b5cf6]/20 disabled:opacity-50"
                  >
                    {h.download} {pluginId}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ol className="space-y-2 text-sm text-[#a1a1aa]">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-mono text-[10px] text-[#52525b]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {selected === 'shopify' ? (
            <a
              href={data.shopify_app_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-[#a78bfa] hover:underline"
            >
              {h.shopifyGuide}
            </a>
          ) : null}

          <div className="grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
            <label className="block text-xs text-[#71717a]">
              {h.storeRef}
              <input
                value={storeRef}
                onChange={(e) => setStoreRef(e.target.value)}
                placeholder={
                  selected === 'shopify'
                    ? 'my-store.myshopify.com'
                    : 'https://my-store.ge'
                }
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={busy}
                onClick={savePlatform}
                className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7c3aed] disabled:opacity-50"
              >
                {h.savePlatform}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#0b0a10] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#52525b]">{h.credentials}</p>
            <div className="mt-2 space-y-2 font-mono text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#71717a]">API URL</span>
                <button type="button" onClick={() => copyText(apiUrl)} className="text-[#a78bfa] hover:underline">
                  {h.copy}
                </button>
              </div>
              <code className="block break-all text-[#c4b5fd]">{apiUrl}</code>
              {testKey ? (
                <p className="text-[#71717a]">
                  {h.testKeyPrefix}: <span className="text-white">{testKey.prefix}…</span>
                </p>
              ) : (
                <p className="text-amber-400/90">{h.noTestKey}</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => createKey('test')}
                className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white"
              >
                {h.createTestKey}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => createKey('live')}
                className="rounded-lg border border-[#22c55e]/30 px-3 py-1.5 text-xs text-[#4ade80] hover:bg-[#22c55e]/10"
              >
                {h.createLiveKey}
              </button>
            </div>
            {newApiKey ? (
              <pre className="mt-3 overflow-x-auto rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-100">
                {h.keyOnce}: {newApiKey}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#0b0a10] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#52525b]">{h.webhooks}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://my-store.ge/?wc-api=wc_georgia_pay"
                className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#13111a] px-3 py-2 font-mono text-xs text-white"
              />
              <button
                type="button"
                disabled={busy || !webhookUrl.trim()}
                onClick={addWebhook}
                className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white"
              >
                {h.addWebhook}
              </button>
            </div>
            {data.webhooks.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-[11px] text-[#71717a]">
                {data.webhooks.map((w) => (
                  <li key={w.id} className="break-all font-mono">
                    {w.enabled ? '●' : '○'} {w.url}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <Link href={route('docsApi')} className="text-[#a78bfa] hover:underline">
              {h.apiDocs}
            </Link>
            <Link href={route('integrations')} className="text-[#a78bfa] hover:underline">
              {h.allGuides}
            </Link>
            <Link
              href={route('integrations')}
              className="text-[#71717a] hover:text-white"
            >
              {locale === 'ka' ? 'ბანკები' : 'Bank setup'} → {route('platform')}
            </Link>
          </div>

          {message ? <p className="text-xs text-[#4ade80]">{message}</p> : null}
        </motion.div>
      </div>
    </div>
  );
}
