'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MerchantConsoleLoginPanel } from '@/components/dashboard/merchant-console-login-panel';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { TransactionFeed } from '@/components/dashboard/transaction-feed';
import { InfrastructurePanel } from '@/components/dashboard/infrastructure-panel';
import { PlatformToolsPanel } from '@/components/dashboard/platform-tools-panel';
import { DashboardTabs, type DashboardTab } from '@/components/dashboard/dashboard-tabs';
import { StatusBadge } from '@/components/laripay/StatusBadge';
import { parseApiJson } from '@/lib/parse-api-json';
import { useLocale } from '@/components/i18n/LocaleProvider';

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
  const { route, t } = useLocale();
  const d = t.dashboard;
  const l = d.login;
  const searchParams = useSearchParams();
  const paidSuccess = searchParams.get('paid') === '1';
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DashboardTab>('overview');

  const loadDashboard = useCallback(async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/laripay/dashboard', { credentials: 'include' });
    const { data: d } = await parseApiJson<DashboardData & { error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok) {
      setData(null);
      setLoggedIn(false);
      setError(d?.error?.message || l.authRequired);
      return;
    }
    setData(d as DashboardData);
    setLoggedIn(true);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function logout() {
    await Promise.all([
      fetch('/api/laripay/portal/logout', { method: 'POST', credentials: 'include' }),
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    ]);
    setData(null);
    setLoggedIn(false);
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
    return <MerchantConsoleLoginPanel onLoggedIn={loadDashboard} />;
  }

  if (!data) return null;

  const hasLiveKey = data.api_keys.some((k) => k.mode === 'live');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {paidSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {d.paidSuccess}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-6"
      >
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="live" pulse>
              {d.controlCenter}
            </Badge>
            <Badge variant={hasLiveKey ? 'live' : 'accent'}>
              {hasLiveKey ? d.productionMode : d.sandboxMode}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{data.merchant.slug}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{data.merchant.email}</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button variant="ghost" onClick={logout}>
            {d.signOut}
          </Button>
        </motion.div>
      </motion.div>

      <DashboardTabs active={tab} onChange={setTab} labels={d.tabs} />

      {tab === 'overview' && (
        <>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StaggerItem><StatCard label={d.payments} value={data.stats.payments_succeeded} pulse /></StaggerItem>
            <StaggerItem><StatCard label={d.grossVolume} value={data.stats.gross_volume} suffix=" ₾" decimals={2} /></StaggerItem>
            <StaggerItem><StatCard label={d.platformFees} value={data.stats.platform_fees} suffix=" ₾" decimals={2} /></StaggerItem>
            <StaggerItem><StatCard label={d.netVolume} value={data.stats.net_volume} suffix=" ₾" decimals={2} trend={d.afterFees} /></StaggerItem>
            <StaggerItem><StatCard label={d.refunds} value={data.stats.refunds_succeeded} /></StaggerItem>
          </Stagger>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <RevenueChart grossVolume={data.stats.gross_volume} />
            <InfrastructurePanel
              tbc={!!data.merchant.bank_configured?.tbc}
              bog={!!data.merchant.bank_configured?.bog}
              billingMode={data.merchant.billing_mode}
            />
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionFeed payments={data.recent_payments} />
          {data.recent_refunds.length > 0 && (
            <Card className="!p-5">
              <h3 className="text-sm font-medium">{d.refunds}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.recent_refunds.map((r) => (
                  <li key={r.id} className="flex justify-between text-foreground-muted">
                    <span>{r.amount.toFixed(2)} ₾</span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'api' && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="!p-5">
              <h3 className="text-sm font-medium">{d.apiKeys}</h3>
              <ul className="mt-3 space-y-2">
                {data.api_keys.map((k) => (
                  <li key={k.id} className="flex items-center justify-between font-mono text-xs">
                    <code className="text-foreground-muted">{k.prefix}…</code>
                    <Badge variant="accent">{k.mode}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="!p-5">
              <h3 className="text-sm font-medium">{d.integration}</h3>
              <p className="mt-2 font-mono text-xs text-foreground-muted">
                POST /api/v1/checkout/sessions
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href={route('playground')} className="text-accent-cyan hover:underline">
                  {d.openPlayground}
                </Link>
                <Link href={route('docs')} className="text-accent-cyan hover:underline">
                  {d.openDocs}
                </Link>
              </div>
            </Card>
          </div>
          <PlatformToolsPanel />
        </>
      )}

      {tab === 'billing' && (
        <Card className="!p-5 max-w-lg">
          <h3 className="text-sm font-medium">{d.billingTitle}</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            {d.billingMode}: <strong>{data.merchant.billing_mode}</strong>
          </p>
          {data.merchant.subscription_plan && (
            <p className="mt-1 text-sm text-foreground-muted">
              {d.plan}: {data.merchant.subscription_plan}
              {data.merchant.subscription_active ? ` (${d.active})` : ''}
            </p>
          )}
          <p className="mt-1 text-sm text-foreground-muted">
            {d.commission}: {(data.merchant.commission_rate_bps ?? 100) / 100}%
          </p>
          <Link href={route('pricing')} className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
            {d.viewPricing}
          </Link>
        </Card>
      )}
    </motion.div>
  );
}
