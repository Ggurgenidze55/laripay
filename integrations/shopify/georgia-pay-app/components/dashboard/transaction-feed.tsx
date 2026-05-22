'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/laripay/StatusBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { formatGel } from '@/lib/utils';

type Payment = {
  id: string;
  amount: number;
  status: string;
  provider: string;
  created: string;
};

export function TransactionFeed({ payments }: { payments: Payment[] }) {
  const { t } = useLocale();
  const d = t.dashboard;

  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-medium">{d.liveTransactions}</h3>
        <p className="text-xs text-foreground-muted">{d.recentActivity}</p>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground-muted">{d.noPayments}</p>
      ) : (
        <ul className="divide-y divide-border">
          {payments.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-inset"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-foreground-muted">{p.id.slice(0, 18)}…</p>
                <p className="text-xs text-foreground-muted/80">
                  {new Date(p.created).toLocaleString(undefined)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-foreground">{formatGel(p.amount)}</p>
                <StatusBadge status={p.status} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}
