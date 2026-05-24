'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { MerchantReadiness, ReadinessItemId } from '@/lib/laripay/merchant-readiness';

type TabTarget = 'overview' | 'integrations' | 'settings' | 'webhooks';

type Props = {
  readiness: MerchantReadiness;
  onGoToTab: (tab: TabTarget) => void;
};

export function MerchantOnboardingChecklist({ readiness, onGoToTab }: Props) {
  const { t, route } = useLocale();
  const c = t.dashboard.checklist;

  const labels: Record<ReadinessItemId, string> = {
    integration: c.items.integration,
    test_key: c.items.testKey,
    webhook: c.items.webhook,
    bank: c.items.bank,
    live_key: c.items.liveKey,
    first_payment: c.items.firstPayment,
  };

  return (
    <div className="mb-5 rounded-xl border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/10 to-transparent p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#c4b5fd]">{c.eyebrow}</p>
          <h2 className="mt-1 text-base font-semibold text-white">{c.title}</h2>
          <p className="mt-1 text-xs text-[#71717a]">{c.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-white">{readiness.progress_percent}%</p>
          <p className="text-[10px] text-[#52525b]">{c.progressLabel}</p>
        </div>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#4ade80] transition-all"
          style={{ width: `${readiness.progress_percent}%` }}
        />
      </div>

      <ul className="space-y-2">
        {readiness.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onGoToTab(item.tab)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition',
                item.done
                  ? 'border-[#22c55e]/20 bg-[#22c55e]/5 text-[#a1a1aa]'
                  : 'border-white/[0.06] bg-[#13111a]/80 text-[#71717a] hover:border-[#8b5cf6]/30',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  item.done ? 'bg-[#22c55e]/20 text-[#4ade80]' : 'bg-white/[0.06] text-[#52525b]',
                )}
              >
                {item.done ? '✓' : '·'}
              </span>
              <span className="min-w-0 flex-1">
                {labels[item.id]}
                {item.optional ? (
                  <span className="ml-1 text-[10px] text-[#52525b]">({c.optional})</span>
                ) : null}
              </span>
              {!item.done && item.id === 'bank' ? (
                <span className="text-[10px] text-amber-400/90">{c.bankPending}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={route('demo')}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0b0a10] hover:opacity-90"
        >
          {c.runDemo}
        </Link>
        <button
          type="button"
          onClick={() => onGoToTab('integrations')}
          className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white"
        >
          {c.openIntegrations}
        </button>
      </div>

      {readiness.ready_for_live ? (
        <p className="mt-3 text-xs text-[#4ade80]">{c.readyLive}</p>
      ) : readiness.ready_for_sandbox ? (
        <p className="mt-3 text-xs text-[#fbbf24]">{c.readySandbox}</p>
      ) : (
        <p className="mt-3 text-xs text-[#71717a]">{c.keepGoing}</p>
      )}
    </div>
  );
}
