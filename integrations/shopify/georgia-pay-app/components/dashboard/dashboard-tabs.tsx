'use client';

import { cn } from '@/lib/utils';

export type DashboardTab = 'overview' | 'transactions' | 'api' | 'billing';

type Props = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  labels: Record<DashboardTab, string>;
};

export function DashboardTabs({ active, onChange, labels }: Props) {
  const tabs: DashboardTab[] = ['overview', 'transactions', 'api', 'billing'];

  return (
    <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === tab
              ? 'bg-accent-blue/15 text-accent-cyan'
              : 'text-foreground-muted hover:text-foreground',
          )}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
