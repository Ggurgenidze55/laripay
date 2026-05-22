'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoginPanel } from '@/components/dashboard/login-panel';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { TransactionFeed } from '@/components/dashboard/transaction-feed';
import { InfrastructurePanel } from '@/components/dashboard/infrastructure-panel';
import { StatusBadge } from '@/components/laripay/StatusBadge';

interface DashboardData {
  merchant: {
    slug: string;
    email: string;
    billing_mode: string;
    commission_rate_bps?: number;
    subscription_active?: boolean;
    subscription_plan?: string | null;
    bank_configured?: { tbc: boolean; bog: boolean };
  };
  stats: {
    payments_succeeded: number;
    refunds_succeeded: number;
    gross_volume: number;
    platform_fees: number;
    net_volume: number;
  };
  recent_payments: {
    id: string;
    status: string;
    amount: number;
    platform_fee: number;
    provider: string;
    created: string;
  }[];
  recent_refunds: {
    id: string;
    payment_id: string;
    status: string;
    amount: number;
    created: string;
  }[];
  api_keys: { id: string; prefix: string; mode: string; name: string | null }[];
  plans: { code: string; name: string; priceGel: number; description: string | null }[];
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const paidSuccess = searchParams.get('paid') === '1';
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/laripay/dashboard', { credentials: 'include' });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) {
      setData(null);
      setLoggedIn(false);
      setError(d?.error?.message || 'Authentication required');
      return;
    }
    setData(d);
    setLoggedIn(true);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/laripay/portal/login', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      credentials: 'include',
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d?.error?.message || 'Login failed');
      return;
    }
    await loadDashboard();
  }

  async function logout() {
    await fetch('/api/laripay/portal/logout', { method: 'POST', credentials: 'include' });
    setData(null);
    setLoggedIn(false);
    setApiKey('');
  }

  if (loading && !loggedIn) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-accent-blue/30 border-t-accent-cyan"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <LoginPanel apiKey={apiKey} setApiKey={setApiKey} error={error} onSubmit={login} />
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {paidSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Payment completed successfully. Stats updating below.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Badge variant="live" pulse className="mb-3">
            Control center
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{data.merchant.slug}</h1>
          <p className="mt-1 text-sm text-white/45">{data.merchant.email}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Payments" value={data.stats.payments_succeeded} pulse />
        <StatCard label="Gross volume" value={data.stats.gross_volume} suffix=" ₾" decimals={2} />
        <StatCard label="Platform fees" value={data.stats.platform_fees} suffix=" ₾" decimals={2} />
        <StatCard label="Net volume" value={data.stats.net_volume} suffix=" ₾" decimals={2} trend="After fees" />
        <StatCard label="Refunds" value={data.stats.refunds_succeeded} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <RevenueChart grossVolume={data.stats.gross_volume} />
        <InfrastructurePanel
          tbc={!!data.merchant.bank_configured?.tbc}
          bog={!!data.merchant.bank_configured?.bog}
          billingMode={data.merchant.billing_mode}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TransactionFeed payments={data.recent_payments} />

        <div className="space-y-6">
          <Card className="!p-5">
            <h3 className="text-sm font-medium">API usage</h3>
            <p className="mt-2 font-mono text-3xl font-semibold text-accent-cyan">
              {data.stats.payments_succeeded * 3 + 12}
            </p>
            <p className="text-xs text-white/35">requests today (est.)</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan"
                initial={{ width: 0 }}
                animate={{ width: '68%' }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </Card>

          {data.api_keys.length > 0 && (
            <Card className="!p-5">
              <h3 className="text-sm font-medium">API keys</h3>
              <ul className="mt-3 space-y-2">
                {data.api_keys.map((k) => (
                  <li key={k.id} className="flex items-center justify-between font-mono text-xs">
                    <code className="text-white/50">{k.prefix}…</code>
                    <Badge variant="accent">{k.mode}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.recent_refunds.length > 0 && (
            <Card className="!p-5">
              <h3 className="text-sm font-medium">Refunds</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.recent_refunds.map((r) => (
                  <li key={r.id} className="flex justify-between text-white/50">
                    <span>{r.amount.toFixed(2)} ₾</span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-8 !p-5">
        <h3 className="text-sm font-medium">Integration</h3>
        <p className="mt-2 font-mono text-xs text-white/40">
          POST /api/v1/checkout/sessions · PATCH /api/laripay/merchants/me
        </p>
        <Link href="/demo" className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
          Run live bank demo →
        </Link>
      </Card>
    </motion.div>
  );
}
