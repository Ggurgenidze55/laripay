'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { parseApiJson } from '@/lib/parse-api-json';
import { AdminLoginPanel } from './admin-login-panel';

type AdminData = {
  platform: {
    phase: string;
    core: { mode?: string; url?: string };
    shops_connected: number;
    webhook_endpoints: number;
    open_checkout_sessions: number;
  };
  stats: {
    merchants_total: number;
    merchants_active: number;
    payments_succeeded: number;
    gross_volume: number;
    platform_fees: number;
    net_volume: number;
  };
  merchants: {
    id: string;
    name: string;
    email: string;
    slug: string;
    status: string;
    billing_mode: string;
    payments_count: number;
    created_at: string;
  }[];
  recent_payments: {
    id: string;
    merchant_slug: string;
    status: string;
    amount: number;
    provider: string;
    created_at: string;
  }[];
};

export function AdminDashboardContent() {
  const { t, route } = useLocale();
  const a = t.admin;
  const [loggedIn, setLoggedIn] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/laripay/admin/dashboard', { credentials: 'include' });
    const { data: d } = await parseApiJson<AdminData & { error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok) {
      setLoggedIn(false);
      setData(null);
      setError(d?.error?.message || a.login.authRequired);
      return;
    }
    setData(d as AdminData);
    setLoggedIn(true);
  }, [a.login.authRequired]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/laripay/admin/portal/logout', { method: 'POST', credentials: 'include' });
    setLoggedIn(false);
    setData(null);
  }

  async function setMerchantStatus(id: string, status: 'active' | 'suspended') {
    await fetch(`/api/laripay/admin/merchants/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (loading && !loggedIn) {
    return <p className="py-20 text-center text-sm text-foreground-muted">{a.loading}</p>;
  }

  if (!loggedIn) {
    return (
      <AdminLoginPanel onLoggedIn={load} />
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="live" pulse className="mb-3">
            {a.controlCenter}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{a.title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {a.subtitle} · Core: {String(data.platform.core?.mode || 'legacy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={route('dashboard')}>
            <Button variant="ghost" size="sm">
              {a.merchantConsole}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            {a.signOut}
          </Button>
        </div>
      </div>

      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard label={a.stats.merchants} value={data.stats.merchants_total} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label={a.stats.payments} value={data.stats.payments_succeeded} pulse />
        </StaggerItem>
        <StaggerItem>
          <StatCard label={a.stats.gross} value={data.stats.gross_volume} suffix=" ₾" decimals={2} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label={a.stats.fees} value={data.stats.platform_fees} suffix=" ₾" decimals={2} />
        </StaggerItem>
      </Stagger>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="!p-5 lg:col-span-1">
          <h3 className="text-sm font-medium">{a.infrastructure}</h3>
          <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
            <li>Shopify shops: {data.platform.shops_connected}</li>
            <li>Webhook endpoints: {data.platform.webhook_endpoints}</li>
            <li>Open checkouts: {data.platform.open_checkout_sessions}</li>
            <li>Active merchants: {data.stats.merchants_active}</li>
          </ul>
        </Card>
        <Card className="!p-5 lg:col-span-2">
          <h3 className="text-sm font-medium">{a.recentPayments}</h3>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-foreground-muted">
                  <th className="py-2">{a.table.merchant}</th>
                  <th>{a.table.amount}</th>
                  <th>{a.table.status}</th>
                  <th>{a.table.provider}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_payments.map((p) => (
                  <tr key={p.id} className="border-t border-border/50">
                    <td className="py-2 font-mono">{p.merchant_slug}</td>
                    <td>{p.amount.toFixed(2)} ₾</td>
                    <td>
                      <Badge variant="accent">{p.status}</Badge>
                    </td>
                    <td>{p.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-8 !p-5">
        <h3 className="text-sm font-medium">{a.merchantsTitle}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs text-foreground-muted">
                <th className="pb-2">{a.table.name}</th>
                <th>{a.table.email}</th>
                <th>{a.table.slug}</th>
                <th>{a.table.status}</th>
                <th>{a.table.payments}</th>
                <th>{a.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.merchants.map((m) => (
                <tr key={m.id} className="border-t border-border/50">
                  <td className="py-3">{m.name}</td>
                  <td className="text-foreground-muted">{m.email}</td>
                  <td className="font-mono text-xs">{m.slug}</td>
                  <td>
                    <Badge variant={m.status === 'active' ? 'live' : 'default'}>{m.status}</Badge>
                  </td>
                  <td>{m.payments_count}</td>
                  <td>
                    {m.status === 'active' ? (
                      <button
                        type="button"
                        className="text-xs text-amber-400 hover:underline"
                        onClick={() => setMerchantStatus(m.id, 'suspended')}
                      >
                        {a.suspend}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-accent-cyan hover:underline"
                        onClick={() => setMerchantStatus(m.id, 'active')}
                      >
                        {a.activate}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
