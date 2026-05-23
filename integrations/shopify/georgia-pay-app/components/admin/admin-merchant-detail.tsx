'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { AdminShell } from './admin-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseApiJson } from '@/lib/parse-api-json';
import { localePath } from '@/lib/i18n/routing';
import { IntegrationPlatformBadge } from '@/components/laripay/integration-platform-badge';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';
import { INTEGRATION_PLATFORMS } from '@/lib/laripay/integration-platform';

type MerchantDetail = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  billing_mode: string;
  commission_rate_bps: number;
  commission_percent: string;
  default_provider: string;
  integration: {
    platform: IntegrationPlatformId;
    label: string;
    ref: string | null;
    inferred: boolean;
    stored_platform: string | null;
    stored_ref: string | null;
  };
  bank_config: {
    tbc_configured: boolean;
    bog_configured: boolean;
    has_tbc_api_key: boolean;
    has_bog_callback_key: boolean;
  };
  stats: {
    payments_succeeded: number;
    gross_volume: number;
    platform_fees: number;
    net_volume: number;
  };
  counts: {
    paykaPayments: number;
    checkoutSessions: number;
    apiKeys: number;
    paykaRefunds: number;
  };
  owner: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    email_verified: boolean;
    phone_verified: boolean;
    two_factor_required: boolean;
  } | null;
  api_keys: {
    id: string;
    prefix: string;
    mode: string;
    name: string | null;
    last_used_at: string | null;
    revoked_at: string | null;
    active: boolean;
  }[];
  webhooks: { id: string; url: string; enabled: boolean; events: string }[];
  payments: {
    id: string;
    status: string;
    amount: number;
    platform_fee: number;
    provider: string;
    bank_reference: string | null;
    created_at: string;
  }[];
  checkout_sessions: {
    id: string;
    status: string;
    amount: number;
    provider: string;
    created_at: string;
  }[];
};

export function AdminMerchantDetail({ merchantId }: { merchantId: string }) {
  const { locale, t } = useLocale();
  const m = t.admin.merchantsManage;
  const [data, setData] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    status: 'active',
    billing_mode: 'COMMISSION',
    commission_rate_bps: 100,
    default_provider: 'tbc',
    integration_platform: 'api' as IntegrationPlatformId,
    integration_ref: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/laripay/admin/merchants/${merchantId}`, { credentials: 'include' });
    const { data: d } = await parseApiJson<MerchantDetail>(res);
    setLoading(false);
    if (d) {
      setData(d);
      setForm({
        name: d.name,
        email: d.email,
        status: d.status,
        billing_mode: d.billing_mode,
        commission_rate_bps: d.commission_rate_bps,
        default_provider: d.default_provider,
        integration_platform: d.integration.platform,
        integration_ref: d.integration.ref || d.integration.stored_ref || '',
      });
    }
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/laripay/admin/merchants/${merchantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        status: form.status,
        billing_mode: form.billing_mode,
        commission_rate_bps: Number(form.commission_rate_bps),
        default_provider: form.default_provider,
        integration_platform: form.integration_platform,
        integration_ref: form.integration_ref || null,
      }),
    });
    const { data: d } = await parseApiJson<{ merchant?: MerchantDetail; error?: { message?: string } }>(res);
    setSaving(false);
    if (!res.ok) {
      setMessage(d?.error?.message || m.saveFailed);
      return;
    }
    setMessage(m.saved);
    await load();
  }

  async function createApiKey(mode: 'test' | 'live') {
    const res = await fetch(`/api/laripay/admin/merchants/${merchantId}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mode, name: `admin-${mode}` }),
    });
    const { data: d } = await parseApiJson<{ api_key?: string }>(res);
    if (d?.api_key) setNewKey(d.api_key);
    await load();
  }

  async function revokeKey(keyId: string) {
    await fetch(`/api/laripay/admin/merchants/${merchantId}/api-keys/${keyId}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    await load();
  }

  if (loading) {
    return (
      <AdminShell title={m.detailLoading}>
        <p className="text-sm text-foreground-muted">{t.admin.loading}</p>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell title={m.notFound}>
        <Link href={localePath(locale, 'admin/merchants')} className="text-accent-cyan hover:underline">
          ← {m.backToList}
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={data.name} subtitle={`${data.slug} · ${data.email}`}>
      <Link
        href={localePath(locale, 'admin/merchants')}
        className="mb-6 inline-block text-sm text-accent-cyan hover:underline"
      >
        ← {m.backToList}
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <p className="text-xs text-foreground-muted">{m.statGross}</p>
          <p className="text-2xl font-semibold">{data.stats.gross_volume.toFixed(2)} ₾</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-foreground-muted">{m.statFees}</p>
          <p className="text-2xl font-semibold">{data.stats.platform_fees.toFixed(2)} ₾</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-foreground-muted">{m.statPayments}</p>
          <p className="text-2xl font-semibold">{data.stats.payments_succeeded}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-foreground-muted">{m.statSessions}</p>
          <p className="text-2xl font-semibold">{data.counts.checkoutSessions}</p>
        </Card>
      </div>

      <Card className="mt-8 !p-5">
        <h3 className="text-sm font-medium">{m.integrationTitle}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <IntegrationPlatformBadge
            platform={data.integration.platform}
            label={data.integration.label}
            inferred={data.integration.inferred}
          />
          <p className="text-xs text-foreground-muted">
            {data.integration.inferred ? m.integrationInferred : m.integrationStored}
          </p>
        </div>
        {data.integration.ref ? (
          <p className="mt-2 font-mono text-xs text-foreground-muted">
            {m.integrationRef}: {data.integration.ref}
          </p>
        ) : null}
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="!p-5">
          <h3 className="text-sm font-medium">{m.editTitle}</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-foreground-muted">
              {m.fieldName}
              <input
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldEmail}
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldStatus}
              <select
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldBilling}
              <select
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.billing_mode}
                onChange={(e) => setForm((f) => ({ ...f, billing_mode: e.target.value }))}
              >
                <option value="COMMISSION">COMMISSION</option>
                <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              </select>
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldCommission}
              <input
                type="number"
                min={0}
                max={5000}
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.commission_rate_bps}
                onChange={(e) => setForm((f) => ({ ...f, commission_rate_bps: Number(e.target.value) }))}
              />
              <span className="text-[10px]"> bps (100 = 1%)</span>
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldProvider}
              <select
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.default_provider}
                onChange={(e) => setForm((f) => ({ ...f, default_provider: e.target.value }))}
              >
                <option value="tbc">TBC</option>
                <option value="bog">BOG</option>
              </select>
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.fieldIntegration}
              <select
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm"
                value={form.integration_platform}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    integration_platform: e.target.value as IntegrationPlatformId,
                  }))
                }
              >
                {INTEGRATION_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-foreground-muted">
              {m.integrationRef}
              <input
                className="mt-1 w-full rounded-lg border border-border bg-canvas-elevated px-3 py-2 text-sm font-mono"
                placeholder="store.myshopify.com"
                value={form.integration_ref}
                onChange={(e) => setForm((f) => ({ ...f, integration_ref: e.target.value }))}
              />
            </label>
            <Button onClick={save} disabled={saving}>
              {saving ? m.saving : m.save}
            </Button>
            {message ? <p className="text-xs text-accent-cyan">{message}</p> : null}
          </div>
        </Card>

        <Card className="!p-5">
          <h3 className="text-sm font-medium">{m.bankTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
            <li>TBC Pay: {data.bank_config.tbc_configured ? m.configured : m.notConfigured}</li>
            <li>BOG Pay: {data.bank_config.bog_configured ? m.configured : m.notConfigured}</li>
            <li>
              {m.defaultBank}: <strong className="text-foreground">{data.default_provider.toUpperCase()}</strong>
            </li>
          </ul>
          {data.owner ? (
            <>
              <h3 className="mt-6 text-sm font-medium">{m.ownerTitle}</h3>
              <ul className="mt-2 space-y-1 text-sm text-foreground-muted">
                <li>{data.owner.email}</li>
                {data.owner.phone ? <li>{data.owner.phone}</li> : null}
                <li>
                  {m.role}: {data.owner.role}
                </li>
                <li>
                  2FA: {data.owner.two_factor_required ? m.on : m.off}
                </li>
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-foreground-muted">{m.noOwner}</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 !p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium">{m.apiKeysTitle}</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => createApiKey('test')}>
              {m.newTestKey}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => createApiKey('live')}>
              {m.newLiveKey}
            </Button>
          </div>
        </div>
        {newKey ? (
          <pre className="mt-3 overflow-x-auto rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            {m.newKeyOnce}: {newKey}
          </pre>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-foreground-muted">
              <tr>
                <th className="pb-2">{m.colPrefix}</th>
                <th>{m.colMode}</th>
                <th>{m.colLastUsed}</th>
                <th>{m.colStatus}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.api_keys.map((k) => (
                <tr key={k.id} className="border-t border-border/50">
                  <td className="py-2 font-mono text-xs">{k.prefix}…</td>
                  <td>{k.mode}</td>
                  <td className="text-xs text-foreground-muted">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}
                  </td>
                  <td>
                    <Badge variant={k.active ? 'live' : 'default'}>
                      {k.active ? m.active : m.revoked}
                    </Badge>
                  </td>
                  <td>
                    {k.active ? (
                      <button
                        type="button"
                        className="text-xs text-amber-400 hover:underline"
                        onClick={() => revokeKey(k.id)}
                      >
                        {m.revokeKey}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 !p-5">
        <h3 className="text-sm font-medium">{m.transactionsTitle}</h3>
        <div className="mt-4 max-h-80 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-foreground-muted">
              <tr>
                <th className="pb-2">ID</th>
                <th>{m.colAmount}</th>
                <th>{m.statFees}</th>
                <th>{m.colProvider}</th>
                <th>{m.colStatus}</th>
                <th>{m.colDate}</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="py-2 font-mono">{p.id.slice(0, 10)}…</td>
                  <td>{p.amount.toFixed(2)} ₾</td>
                  <td>{p.platform_fee.toFixed(2)}</td>
                  <td>{p.provider}</td>
                  <td>
                    <Badge variant="accent">{p.status}</Badge>
                  </td>
                  <td className="text-foreground-muted">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data.webhooks.length > 0 ? (
        <Card className="mt-6 !p-5">
          <h3 className="text-sm font-medium">{m.webhooksTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.webhooks.map((w) => (
              <li key={w.id} className="rounded-lg border border-border/50 px-3 py-2">
                <p className="break-all font-mono text-xs">{w.url}</p>
                <p className="text-xs text-foreground-muted">
                  {w.enabled ? m.enabled : m.disabled} · {w.events}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </AdminShell>
  );
}
