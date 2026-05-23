'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { AdminShell } from './admin-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { parseApiJson } from '@/lib/parse-api-json';
import { localePath } from '@/lib/i18n/routing';
import { IntegrationPlatformBadge } from '@/components/laripay/integration-platform-badge';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

type MerchantRow = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  billing_mode: string;
  commission_rate_bps: number;
  default_provider: string;
  integration: {
    platform: IntegrationPlatformId;
    label: string;
    ref: string | null;
    inferred: boolean;
  };
  payments_count: number;
  api_keys_count: number;
  primary_api_key: { prefix: string; mode: string; last_used_at: string | null } | null;
  owner: { id: string; email: string; role: string } | null;
  created_at: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  merchant_id: string | null;
  merchant: { id: string; name: string; slug: string; status: string } | null;
  created_at: string;
};

export function AdminMerchantsList() {
  const { locale, t } = useLocale();
  const m = t.admin.merchantsManage;
  const [tab, setTab] = useState<'merchants' | 'users'>('merchants');
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/laripay/admin/merchants?users=1', { credentials: 'include' });
    const { data } = await parseApiJson<{ merchants: MerchantRow[]; users: UserRow[] }>(res);
    setLoading(false);
    if (data) {
      setMerchants(data.merchants || []);
      setUsers(data.users || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const needle = q.trim().toLowerCase();
  const filteredMerchants = merchants.filter(
    (row) =>
      !needle ||
      row.name.toLowerCase().includes(needle) ||
      row.email.toLowerCase().includes(needle) ||
      row.slug.toLowerCase().includes(needle),
  );
  const filteredUsers = users.filter(
    (row) =>
      !needle ||
      row.email.toLowerCase().includes(needle) ||
      (row.name || '').toLowerCase().includes(needle),
  );

  return (
    <AdminShell title={m.title} subtitle={m.subtitle}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={m.search}
          className="w-full max-w-md rounded-xl border border-border bg-canvas-elevated px-4 py-2.5 text-sm"
        />
        <div className="flex rounded-xl border border-border p-1">
          <button
            type="button"
            onClick={() => setTab('merchants')}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'merchants' ? 'bg-foreground/10 font-medium' : 'text-foreground-muted'}`}
          >
            {m.tabMerchants} ({merchants.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'users' ? 'bg-foreground/10 font-medium' : 'text-foreground-muted'}`}
          >
            {m.tabUsers} ({users.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-foreground-muted">{t.admin.loading}</p>
      ) : tab === 'merchants' ? (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-canvas-elevated/80 text-xs text-foreground-muted">
                <tr>
                  <th className="px-4 py-3">{m.colMerchant}</th>
                  <th className="px-4 py-3">{m.colIntegration}</th>
                  <th className="px-4 py-3">{m.colApi}</th>
                  <th className="px-4 py-3">{m.colBilling}</th>
                  <th className="px-4 py-3">{m.colPayments}</th>
                  <th className="px-4 py-3">{m.colStatus}</th>
                  <th className="px-4 py-3">{m.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((row) => (
                  <tr key={row.id} className="border-t border-border/50 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-foreground-muted">{row.email}</p>
                      <p className="font-mono text-[10px] text-foreground-muted">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <IntegrationPlatformBadge
                        platform={row.integration.platform}
                        label={row.integration.label}
                        inferred={row.integration.inferred}
                        title={row.integration.inferred ? m.integrationInferred : m.integrationStored}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.primary_api_key ? (
                        <>
                          <span>{row.primary_api_key.prefix}…</span>
                          <Badge variant="default" className="ml-2">
                            {row.primary_api_key.mode}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-foreground-muted">{m.noApiKey}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p>{row.billing_mode}</p>
                      <p className="text-foreground-muted">
                        {(row.commission_rate_bps / 100).toFixed(2)}% · {row.default_provider.toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">{row.payments_count}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'active' ? 'live' : 'default'}>{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={localePath(locale, `admin/merchants/${row.id}`)}
                        className="text-sm text-accent-cyan hover:underline"
                      >
                        {m.openDetail}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-canvas-elevated/80 text-xs text-foreground-muted">
                <tr>
                  <th className="px-4 py-3">{m.colUser}</th>
                  <th className="px-4 py-3">{m.colRole}</th>
                  <th className="px-4 py-3">{m.colMerchant}</th>
                  <th className="px-4 py-3">{m.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((row) => (
                  <tr key={row.id} className="border-t border-border/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.email}</p>
                      {row.name ? <p className="text-xs text-foreground-muted">{row.name}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.role === 'platform_admin' ? 'accent' : 'default'}>{row.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.merchant ? (
                        <>
                          {row.merchant.name}
                          <span className="ml-1 font-mono text-foreground-muted">({row.merchant.slug})</span>
                        </>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.merchant ? (
                        <Link
                          href={localePath(locale, `admin/merchants/${row.merchant.id}`)}
                          className="text-sm text-accent-cyan hover:underline"
                        >
                          {m.openDetail}
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
