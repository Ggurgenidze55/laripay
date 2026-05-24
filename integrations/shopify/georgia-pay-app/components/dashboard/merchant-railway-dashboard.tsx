'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatGel } from '@/lib/utils';
import { StatusBadge } from '@/components/laripay/StatusBadge';
import { IntegrationPlatformBadge } from '@/components/laripay/integration-platform-badge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';
import {
  countEnabledServices,
  type MerchantServiceId,
} from '@/lib/laripay/merchant-services';

export type MerchantDashboardData = {
  merchant: {
    slug: string;
    email: string;
    billing_mode: string;
    integration?: {
      platform: IntegrationPlatformId;
      label: string;
      ref: string | null;
      inferred: boolean;
    };
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
  services?: {
    id: MerchantServiceId;
    enabled: boolean;
    region: string;
    integration_platform?: IntegrationPlatformId;
  }[];
};

type Tab = 'overview' | 'transactions' | 'integrations' | 'webhooks' | 'billing';

type Props = {
  data: MerchantDashboardData;
  hasLiveKey: boolean;
  onSignOut: () => void;
  /** Fill viewport app shell — hides duplicate header/actions */
  fullscreen?: boolean;
};

function volumeBars(payments: MerchantDashboardData['recent_payments']) {
  if (payments.length === 0) return [20, 28, 22, 35, 30, 40, 32, 38];
  const buckets = Array.from({ length: 8 }, () => 0);
  for (const p of payments) {
    const age = Date.now() - new Date(p.created).getTime();
    const slot = Math.min(7, Math.floor(age / (3 * 60 * 60 * 1000)));
    buckets[7 - slot] += p.amount;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((v) => Math.max(18, Math.round((v / max) * 92)));
}

function eventLogs(payments: MerchantDashboardData['recent_payments'], refunds: MerchantDashboardData['recent_refunds']) {
  const lines: string[] = [];
  for (const p of payments.slice(0, 4)) {
    const evt =
      p.status === 'succeeded'
        ? 'payment.succeeded'
        : p.status === 'failed'
          ? 'payment.failed'
          : 'checkout.session.completed';
    lines.push(`${evt} · ${p.provider.toUpperCase()} · ${p.amount.toFixed(2)} GEL`);
  }
  for (const r of refunds.slice(0, 2)) {
    lines.push(`refund.${r.status} · ${r.amount.toFixed(2)} GEL`);
  }
  if (lines.length === 0) {
    return [
      '$ laripay listen --forward-to /api/webhook',
      '→ Ready. Waiting for checkout events…',
      'GET /api/v1/checkout/sessions — sandbox',
      'POST /api/v1/webhooks — register endpoint',
    ];
  }
  return lines;
}

export function MerchantRailwayDashboard({ data, hasLiveKey, onSignOut, fullscreen = false }: Props) {
  const { t, route } = useLocale();
  const d = t.dashboard;
  const r = d.railway;
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedService, setSelectedService] = useState(0);
  const [bars, setBars] = useState(() => volumeBars(data.recent_payments));

  const banksCount = (data.merchant.bank_configured?.tbc ? 1 : 0) + (data.merchant.bank_configured?.bog ? 1 : 0);

  const serviceLabel = (id: MerchantServiceId, platform?: IntegrationPlatformId) => {
    if (id === 'integration') {
      const p = platform ?? data.merchant.integration?.platform;
      return p === 'shopify' ? r.services.shopify : r.services.restApi;
    }
    return r.services[id];
  };

  const services = useMemo(() => {
    if (data.services?.length) {
      return data.services.map((s) => ({
        id: s.id,
        name: serviceLabel(s.id, s.integration_platform ?? data.merchant.integration?.platform),
        region: s.region,
        live: s.enabled,
      }));
    }
    const hasKeys = data.api_keys.length > 0;
    const tbc = !!data.merchant.bank_configured?.tbc;
    const bog = !!data.merchant.bank_configured?.bog;
    const banksAny = tbc || bog;
    return [
      { id: 'checkout' as const, name: r.services.checkout, region: 'eu-west', live: hasKeys || banksAny },
      { id: 'webhooks' as const, name: r.services.webhooks, region: 'eu-west', live: false },
      { id: 'tbc' as const, name: r.services.tbc, region: 'ge-tbc', live: tbc },
      { id: 'bog' as const, name: r.services.bog, region: 'ge-bog', live: bog },
      { id: 'delivery' as const, name: r.services.delivery, region: 'ge', live: false },
      { id: 'warehouse' as const, name: r.services.warehouse, region: 'ge', live: false },
      { id: 'installments' as const, name: r.services.installments, region: 'ge', live: banksAny },
      {
        id: 'integration' as const,
        name:
          data.merchant.integration?.platform === 'shopify' ? r.services.shopify : r.services.restApi,
        region: data.merchant.integration?.platform || 'api',
        live: hasKeys || banksAny,
      },
    ];
  }, [data, r.services]);

  const serviceHealth = useMemo(() => {
    const rows = data.services?.length
      ? data.services.map((s) => ({ id: s.id, enabled: s.enabled, region: s.region }))
      : services.map((s) => ({ id: s.id, enabled: s.live, region: s.region }));
    return countEnabledServices(rows);
  }, [data.services, services]);

  const FEATURE_SERVICE_IDS: (MerchantServiceId | null)[] = [
    'checkout',
    'checkout',
    'webhooks',
    'integration',
    'integration',
    'delivery',
    'warehouse',
    'installments',
    null,
  ];

  const isServiceEnabled = (id: MerchantServiceId | null) => {
    if (!id) return true;
    const row = services.find((s) => s.id === id);
    return row?.live ?? false;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: d.tabs.overview },
    { id: 'transactions', label: d.tabs.transactions },
    { id: 'integrations', label: d.tabs.integrations },
    { id: 'webhooks', label: d.tabs.webhooks },
    { id: 'billing', label: d.tabs.billing },
  ];

  const logs = eventLogs(data.recent_payments, data.recent_refunds);
  const successRate =
    data.stats.payments_succeeded === 0
      ? '—'
      : `${(
          (data.recent_payments.filter((p) => p.status === 'succeeded').length /
            Math.max(data.recent_payments.length, 1)) *
          100
        ).toFixed(1)}%`;

  useEffect(() => {
    setBars(volumeBars(data.recent_payments));
  }, [data.recent_payments]);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => prev.map((v) => Math.max(18, Math.min(95, v + (Math.random() - 0.5) * 8))));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const statLabels = [r.stats.payments, r.stats.banks, r.stats.features];
  const statValues = [String(data.stats.payments_succeeded), String(banksCount || 7), 'GEL'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex min-h-0 w-full flex-col', fullscreen ? 'h-full flex-1' : 'mx-auto max-w-[1280px]')}
    >
      {!fullscreen ? (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-start justify-between gap-4"
      >
        <motion.div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#71717a]">{d.controlCenter}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{data.merchant.slug}</h1>
          <p className="mt-1 text-sm text-[#71717a]">{data.merchant.email}</p>
          <motion.div className="mt-3 flex flex-wrap gap-2">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                hasLiveKey
                  ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]'
                  : 'border-[#a78bfa]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]',
              )}
            >
              {hasLiveKey ? d.productionMode : d.sandboxMode}
            </span>
            {data.merchant.integration ? (
              <IntegrationPlatformBadge
                platform={data.merchant.integration.platform}
                label={data.merchant.integration.label}
                inferred={data.merchant.integration.inferred}
              />
            ) : null}
          </motion.div>
        </motion.div>
        <motion.div className="flex flex-wrap gap-2">
          <Link
            href={route('docs')}
            className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:border-[#8b5cf6]/40 hover:text-white"
          >
            {d.openDocs}
          </Link>
          <Link
            href={route('demo')}
            className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:border-[#8b5cf6]/40 hover:text-white"
          >
            {d.runDemo}
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] transition hover:border-red-500/40 hover:text-red-300"
          >
            {d.signOut}
          </button>
        </motion.div>
      </motion.div>
      ) : null}

      <motion.div className={cn('relative min-h-0', fullscreen && 'flex flex-1 flex-col')}>
        {!fullscreen ? (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#8b5cf6]/30 via-[#8b5cf6]/8 to-transparent opacity-50" />
        ) : null}
        <motion.div
          className={cn(
            'relative flex min-h-0 flex-col overflow-hidden border border-white/[0.12] bg-[#0f0d14] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]',
            fullscreen ? 'h-full flex-1 rounded-xl' : 'rounded-2xl',
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#13111a]/80 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ef4444]/90" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#eab308]/90" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22c55e]/90" />
              <span className="ml-2 truncate font-mono text-[11px] text-[#71717a]">
                {data.merchant.slug} / production
              </span>
              {fullscreen && data.merchant.integration ? (
                <IntegrationPlatformBadge
                  platform={data.merchant.integration.platform}
                  label={data.merchant.integration.label}
                  inferred={data.merchant.integration.inferred}
                />
              ) : null}
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                serviceHealth.allEnabled
                  ? 'border-[#22c55e]/25 bg-[#22c55e]/10 text-[#4ade80]'
                  : serviceHealth.enabled > 0
                    ? 'border-[#eab308]/25 bg-[#eab308]/10 text-[#fbbf24]'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#71717a]',
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                {serviceHealth.allEnabled ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
                ) : null}
                <span
                  className={cn(
                    'relative h-1.5 w-1.5 rounded-full',
                    serviceHealth.allEnabled
                      ? 'bg-[#4ade80]'
                      : serviceHealth.enabled > 0
                        ? 'bg-[#fbbf24]'
                        : 'bg-[#52525b]',
                  )}
                />
              </span>
              {serviceHealth.allEnabled
                ? r.allOperational
                : r.servicesActiveCount
                    .replace('{enabled}', String(serviceHealth.enabled))
                    .replace('{total}', String(serviceHealth.total))}
            </span>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0b0a10]/50 px-4 pt-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'shrink-0 rounded-t-md px-3 py-2 text-xs font-medium transition-colors',
                  tab === item.id
                    ? 'border-b-2 border-[#a78bfa] bg-white/[0.04] text-white'
                    : 'text-[#71717a] hover:text-[#a1a1aa]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[240px_1fr_220px]">
            <aside className="hidden min-h-0 overflow-y-auto border-r border-white/[0.06] p-4 lg:block">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#52525b]">{r.servicesTitle}</p>
              <ul className="space-y-1">
                {services.map((s, i) => (
                  <li key={s.id ?? s.name}>
                    <button
                      type="button"
                      onClick={() => setSelectedService(i)}
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-left transition-colors',
                        selectedService === i
                          ? 'bg-[#8b5cf6]/15 ring-1 ring-[#8b5cf6]/25'
                          : 'hover:bg-white/[0.03]',
                        !s.live && selectedService !== i && 'opacity-60',
                      )}
                    >
                      <motion.div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            s.live ? 'bg-[#4ade80] shadow-[0_0_6px_#4ade80]' : 'bg-[#3f3f46]',
                          )}
                        />
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate font-mono text-xs',
                            s.live
                              ? selectedService === i
                                ? 'text-[#e9d5ff]'
                                : 'text-[#a1a1aa]'
                              : 'text-[#52525b]',
                          )}
                        >
                          {s.name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded px-1 py-px font-mono text-[9px] uppercase tracking-wide',
                            s.live
                              ? 'bg-[#22c55e]/15 text-[#4ade80]'
                              : 'bg-white/[0.04] text-[#52525b]',
                          )}
                        >
                          {s.live ? r.serviceOn : r.serviceOff}
                        </span>
                      </motion.div>
                      <p className="mt-0.5 pl-3.5 font-mono text-[10px] text-[#52525b]">{String(s.region)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              {tab === 'overview' && (
                <>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#52525b]">{r.activeMerchant}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {data.merchant.slug} · {data.merchant.integration?.label || 'REST API'}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#71717a]">
                        {formatGel(data.stats.gross_volume)} {r.grossLabel} · {data.merchant.billing_mode}
                      </p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:gap-2">
                      {statValues.map((val, i) => (
                        <motion.div
                          key={statLabels[i]}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center"
                        >
                          <p className="text-[9px] uppercase tracking-wide text-[#52525b]">{statLabels[i]}</p>
                          <p className="font-mono text-sm font-bold text-white">{val}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: d.grossVolume, value: formatGel(data.stats.gross_volume) },
                      { label: d.netVolume, value: formatGel(data.stats.net_volume) },
                      { label: d.platformFees, value: formatGel(data.stats.platform_fees) },
                      { label: d.refunds, value: String(data.stats.refunds_succeeded) },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-white/[0.06] bg-[#13111a] p-3">
                        <p className="text-[10px] uppercase text-[#52525b]">{m.label}</p>
                        <p className="mt-1 font-mono text-lg font-bold text-white">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[#52525b]">
                      {d.volumeTrend} · {d.last7Days}
                    </p>
                    <div className="flex h-24 items-end gap-1.5">
                      {bars.map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-[#6366f1] to-[#a78bfa]"
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ minHeight: 4 }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    {logs.slice(0, 6).map((line, i) => (
                      <div key={`${line}-${i}`} className="flex gap-2 rounded px-1 py-0.5 hover:bg-white/[0.02]">
                        <span className="shrink-0 text-[#52525b]">{String(i + 1).padStart(2, '0')}</span>
                        <span
                          className={cn(
                            line.includes('succeeded') || line.includes('OK')
                              ? 'text-[#4ade80]'
                              : line.includes('checkout') || line.includes('payment')
                                ? 'text-[#c4b5fd]'
                                : line.includes('refund')
                                  ? 'text-[#fbbf24]'
                                  : 'text-[#71717a]',
                          )}
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === 'transactions' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#71717a]">{d.recentActivity}</p>
                  {data.recent_payments.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#52525b]">{d.noPayments}</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.recent_payments.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#13111a] px-3 py-2.5"
                        >
                          <motion.div className="min-w-0">
                            <p className="truncate font-mono text-xs text-[#a1a1aa]">{p.id}</p>
                            <p className="text-[10px] text-[#52525b]">
                              {p.provider.toUpperCase()} · {new Date(p.created).toLocaleString()}
                            </p>
                          </motion.div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-white">{formatGel(p.amount)}</span>
                            <StatusBadge status={p.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {data.recent_refunds.length > 0 && (
                    <>
                      <p className="pt-2 text-xs font-medium text-[#71717a]">{d.refunds}</p>
                      <ul className="space-y-2">
                        {data.recent_refunds.map((rfd) => (
                          <li
                            key={rfd.id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#13111a] px-3 py-2.5 text-sm"
                          >
                            <span className="font-mono text-xs text-[#71717a]">{rfd.payment_id.slice(0, 16)}…</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">{formatGel(rfd.amount)}</span>
                              <StatusBadge status={rfd.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {tab === 'integrations' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#a1a1aa]">{r.integrationsIntro}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {r.features.map((f, idx) => {
                      const svcId = FEATURE_SERVICE_IDS[idx] ?? null;
                      const on = isServiceEnabled(svcId);
                      return (
                      <div
                        key={f.title}
                        className={cn(
                          'rounded-lg border bg-[#13111a] p-3',
                          on ? 'border-[#22c55e]/20' : 'border-white/[0.06] opacity-75',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-medium', on ? 'text-white' : 'text-[#71717a]')}>{f.title}</p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase',
                              on
                                ? 'bg-[#22c55e]/15 text-[#4ade80]'
                                : 'bg-white/[0.04] text-[#52525b]',
                            )}
                          >
                            <span
                              className={cn(
                                'h-1 w-1 rounded-full',
                                on ? 'bg-[#4ade80] shadow-[0_0_4px_#4ade80]' : 'bg-[#52525b]',
                              )}
                            />
                            {on ? r.serviceOn : r.serviceOff}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#71717a]">{f.desc}</p>
                        {'endpoint' in f && f.endpoint ? (
                          <p className="mt-2 font-mono text-[10px] text-[#c4b5fd]">{f.endpoint}</p>
                        ) : null}
                      </div>
                    );
                    })}
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
                    <p className="text-xs font-medium text-[#a1a1aa]">{d.apiKeys}</p>
                    <ul className="mt-2 space-y-2">
                      {data.api_keys.map((k) => (
                        <li key={k.id} className="flex items-center justify-between font-mono text-xs">
                          <code className="text-[#71717a]">{k.prefix}…</code>
                          <span className="rounded bg-[#8b5cf6]/20 px-1.5 py-0.5 text-[10px] uppercase text-[#c4b5fd]">
                            {k.mode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <Link href={route('integrations')} className="text-[#a78bfa] hover:underline">
                      {r.allIntegrations}
                    </Link>
                    <Link href={route('docsApi')} className="text-[#a78bfa] hover:underline">
                      {d.openDocs}
                    </Link>
                    <Link href={route('platform')} className="text-[#a78bfa] hover:underline">
                      {d.platformTools.viewPlatform}
                    </Link>
                  </div>
                </div>
              )}

              {tab === 'webhooks' && (
                <motion.div className="space-y-4">
                  <p className="text-sm text-[#a1a1aa]">{r.webhooksIntro}</p>
                  <div className="rounded-lg border border-white/[0.06] bg-[#0b0a10] p-4">
                    <pre className="max-h-[280px] overflow-auto font-mono text-[11px] leading-relaxed text-[#71717a]">
                      {logs.map((line, i) => (
                        <motion.div key={`${line}-${i}`} className={line.includes('succeeded') ? 'text-[#4ade80]' : ''}>
                          {line}
                        </motion.div>
                      ))}
                    </pre>
                  </div>
                  <ul className="space-y-2 text-[11px] text-[#71717a]">
                    {r.webhookEvents.map((evt) => (
                      <li key={evt} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-[#8b5cf6]" />
                        <code className="text-[#c4b5fd]">{evt}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-[#52525b]">{d.bankHostedNote}</p>
                </motion.div>
              )}

              {tab === 'billing' && (
                <div className="max-w-lg space-y-4">
                  <div className="rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
                    <p className="text-sm font-medium text-white">{d.billingTitle}</p>
                    <p className="mt-2 text-sm text-[#71717a]">
                      {d.billingMode}: <strong className="text-white">{data.merchant.billing_mode}</strong>
                    </p>
                    {data.merchant.subscription_plan ? (
                      <p className="mt-1 text-sm text-[#71717a]">
                        {d.plan}: {data.merchant.subscription_plan}
                        {data.merchant.subscription_active ? ` (${d.active})` : ''}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-[#71717a]">
                      {d.commission}: {(data.merchant.commission_rate_bps ?? 100) / 100}%
                    </p>
                    <p className="mt-4 text-xs text-[#52525b]">{d.subscriptionNote}</p>
                    <Link href={route('pricing')} className="mt-4 inline-block text-sm text-[#a78bfa] hover:underline">
                      {d.viewPricing}
                    </Link>
                  </div>
                  {data.plans.length > 0 && (
                    <ul className="space-y-2">
                      {data.plans.map((plan) => (
                        <li
                          key={plan.code}
                          className="rounded-lg border border-white/[0.06] bg-[#13111a] px-3 py-2.5 text-sm"
                        >
                          <span className="font-medium text-white">{plan.name}</span>
                          <span className="ml-2 font-mono text-[#a78bfa]">{plan.priceGel} ₾</span>
                          {plan.description ? (
                            <p className="mt-1 text-xs text-[#52525b]">{plan.description}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <aside className="hidden min-h-0 overflow-y-auto border-l border-white/[0.06] p-4 lg:block">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#52525b]">{r.observability}</p>
              <div className="space-y-3">
                {[
                  { label: r.metrics.successRate, pct: successRate === '—' ? 0 : parseFloat(successRate) },
                  { label: r.metrics.apiKeys, pct: Math.min(100, data.api_keys.length * 25) },
                  { label: r.metrics.banksLive, pct: banksCount === 0 ? 0 : banksCount === 2 ? 100 : 50 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-[#71717a]">{m.label}</span>
                      <span className="font-mono text-[#a1a1aa]">
                        {typeof m.pct === 'number' && m.label === r.metrics.successRate && successRate !== '—'
                          ? successRate
                          : typeof m.pct === 'number'
                            ? `${Math.round(m.pct)}%`
                            : m.pct}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
                        initial={{ width: 0 }}
                        animate={{ width: `${typeof m.pct === 'number' ? m.pct : 0}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 border-t border-white/[0.06] pt-4 text-[10px] text-[#52525b]">
                <p>{r.quickLinks.health}: <Link href="/api/health" className="text-[#a78bfa]">/api/health</Link></p>
                <p>{r.quickLinks.status}: <Link href={route('status')} className="text-[#a78bfa]">{route('status')}</Link></p>
                <p>{r.quickLinks.security}: <Link href={route('security')} className="text-[#a78bfa]">{route('security')}</Link></p>
              </div>
            </aside>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
