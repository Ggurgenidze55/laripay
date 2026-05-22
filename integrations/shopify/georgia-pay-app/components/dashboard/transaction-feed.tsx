'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/laripay/StatusBadge';
import { formatGel } from '@/lib/utils';

type Payment = {
  id: string;
  status: string;
  amount: number;
  platform_fee: number;
  provider: string;
  created: string;
};

export function TransactionFeed({ payments }: { payments: Payment[] }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-sm font-medium">Live transactions</h3>
        <p className="text-xs text-white/35">Recent payment activity</p>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-white/40">No payments yet</p>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {payments.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02]"
            >
              <span className="h-8 w-8 rounded-lg bg-accent-blue/10 flex items-center justify-center font-mono text-[10px] text-accent-cyan uppercase">
                {p.provider.slice(0, 3)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-white/50">{p.id.slice(0, 18)}…</p>
                <p className="text-xs text-white/30">{new Date(p.created).toLocaleString('ka-GE')}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-white/90">{formatGel(p.amount)}</p>
                <StatusBadge status={p.status} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}
