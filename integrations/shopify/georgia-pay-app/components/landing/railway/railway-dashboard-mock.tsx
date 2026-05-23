'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TABS = ['Overview', 'Deployments', 'Logs', 'Metrics'] as const;

type Tab = (typeof TABS)[number];

export function RailwayDashboardMock({
  logs,
  statLabels,
  statValues,
  compact = false,
}: {
  logs: readonly string[];
  statLabels: readonly string[];
  statValues: readonly string[];
  compact?: boolean;
}) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [bars, setBars] = useState([40, 65, 45, 80, 55, 90, 70, 85]);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => prev.map((v) => Math.max(25, Math.min(95, v + (Math.random() - 0.5) * 18))));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const services = [
    { name: 'checkout-api', status: 'live', region: 'eu-west' },
    { name: 'webhook-worker', status: 'live', region: 'eu-west' },
    { name: 'tbc-connector', status: 'live', region: 'ge-tbc' },
    { name: 'bog-connector', status: 'idle', region: 'ge-bog' },
  ];

  const logLimit = 5;

  return (
    <div className={cn('relative mx-auto w-full', compact ? 'max-w-full' : 'max-w-5xl')}>
      {!compact ? (
        <>
          <motion.div
            className="pointer-events-none absolute -left-10 top-1/4 h-40 w-40 rounded-full bg-[#8b5cf6]/20 blur-3xl sm:-left-20 sm:h-64 sm:w-64"
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-[#6366f1]/15 blur-3xl sm:-right-16 sm:h-48 sm:w-48"
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </>
      ) : null}

      <div className="relative">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#8b5cf6]/30 via-[#8b5cf6]/8 to-transparent opacity-50" />
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0f0d14] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
          <div className={cn('flex items-center justify-between border-b border-white/[0.06] bg-[#13111a]/80 px-4', compact ? 'py-2.5' : 'py-2.5')}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/90" />
              <span className="ml-2 font-mono text-[11px] text-[#71717a]">laripay / production</span>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#4ade80] sm:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              </span>
              All systems operational
            </span>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0b0a10]/50 px-4 pt-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'shrink-0 rounded-t-md px-3 py-2 text-xs font-medium transition-colors',
                  tab === t
                    ? 'border-b-2 border-[#a78bfa] bg-white/[0.04] text-white'
                    : 'text-[#71717a] hover:text-[#a1a1aa]',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={cn('grid lg:grid-cols-[240px_1fr_220px]', compact && 'lg:min-h-[400px]')}>
            <aside className={cn('hidden border-r border-white/[0.06] lg:block', compact ? 'p-5' : 'p-4')}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#52525b]">Services</p>
              <ul className="space-y-1">
                {services.map((s, i) => (
                  <li
                    key={s.name}
                    className={cn(
                      'rounded-lg px-2.5 py-2 transition-colors',
                      i === 0 ? 'bg-[#8b5cf6]/15 ring-1 ring-[#8b5cf6]/25' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          s.status === 'live' ? 'bg-[#4ade80] shadow-[0_0_6px_#4ade80]' : 'bg-[#52525b]',
                        )}
                      />
                      <span className={cn('font-mono text-xs', i === 0 ? 'text-[#e9d5ff]' : 'text-[#71717a]')}>
                        {s.name}
                      </span>
                    </div>
                    <p className="mt-0.5 pl-3.5 font-mono text-[10px] text-[#52525b]">{s.region}</p>
                  </li>
                ))}
              </ul>
            </aside>

            <div
              className={cn(
                'p-3 sm:p-4 md:p-5',
                compact ? 'min-h-[280px] sm:min-h-[320px] lg:min-h-[380px]' : 'min-h-[220px] sm:min-h-[260px] md:min-h-[280px]',
              )}
            >
              {tab === 'Overview' && (
                <>
                  <div className={cn('flex flex-wrap items-start justify-between gap-3', compact ? 'mb-4' : 'mb-4')}>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#52525b]">Active deployment</p>
                      <p className="mt-1 text-sm font-semibold text-white">checkout-api · v2.4.1</p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#71717a]">Deployed 2m ago via API</p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:gap-2">
                      {statValues.map((val, i) => (
                        <div
                          key={statLabels[i]}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center sm:px-3 sm:py-2"
                        >
                          <p className="truncate text-[8px] uppercase tracking-wide text-[#52525b] sm:text-[9px]">{statLabels[i]}</p>
                          <p className="font-mono text-xs font-bold text-white sm:text-sm">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn('rounded-lg border border-white/[0.06] bg-[#13111a]', compact ? 'mb-4 p-4' : 'mb-4 p-3')}>
                    <p className={cn('mb-3 font-medium uppercase tracking-wider text-[#52525b]', compact ? 'text-[11px]' : 'text-[10px]')}>
                      Volume · last 8h
                    </p>
                    <div className={cn('flex items-end gap-1.5', compact ? 'h-24' : 'h-16')}>
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

                  <div className={cn('space-y-1.5 font-mono text-[11px]', compact ? 'hidden sm:block' : 'hidden sm:block')}>
                    {logs.slice(0, logLimit).map((line, i) => (
                      <div key={`${line}-${i}`} className="flex gap-2 rounded px-1 py-0.5 hover:bg-white/[0.02]">
                        <span className="shrink-0 text-[#52525b]">{String(i + 1).padStart(2, '0')}</span>
                        <span
                          className={cn(
                            line.includes('200') || line.includes('succeeded') || line.includes('OK')
                              ? 'text-[#4ade80]'
                              : line.includes('checkout')
                                ? 'text-[#c4b5fd]'
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

              {tab === 'Deployments' && (
                <ul className="space-y-2">
                  {['v2.4.1 · checkout-api', 'v2.4.0 · webhook-worker', 'v2.3.9 · tbc-connector'].map((d, i) => (
                    <li
                      key={d}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#13111a] px-3 py-2.5"
                    >
                      <span className="font-mono text-xs text-[#a1a1aa]">{d}</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase',
                          i === 0 ? 'text-[#4ade80]' : 'text-[#52525b]',
                        )}
                      >
                        {i === 0 ? 'active' : 'previous'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {tab === 'Logs' && (
                <pre className="max-h-[240px] overflow-auto font-mono text-[11px] leading-relaxed text-[#71717a]">
                  {logs.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </pre>
              )}

              {tab === 'Metrics' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Success rate', value: '99.97%' },
                    { label: 'p99 latency', value: '118ms' },
                    { label: 'Active sessions', value: '847' },
                    { label: 'Webhooks/min', value: '1.2k' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
                      <p className="text-[10px] uppercase text-[#52525b]">{m.label}</p>
                      <p className="mt-1 font-mono text-xl font-bold text-white">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className={cn('hidden border-l border-white/[0.06] lg:block', compact ? 'p-5' : 'p-4')}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#52525b]">Observability</p>
              <div className="space-y-3">
                {[
                  { label: 'CPU', pct: 34 },
                  { label: 'Memory', pct: 52 },
                  { label: 'Network', pct: 18 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-[#71717a]">{m.label}</span>
                      <span className="font-mono text-[#a1a1aa]">{m.pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
