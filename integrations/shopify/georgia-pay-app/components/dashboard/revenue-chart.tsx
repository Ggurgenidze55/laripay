'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/components/i18n/LocaleProvider';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DATA = [
  { day: 'Mon', volume: 1200 },
  { day: 'Tue', volume: 1850 },
  { day: 'Wed', volume: 1420 },
  { day: 'Thu', volume: 2100 },
  { day: 'Fri', volume: 2680 },
  { day: 'Sat', volume: 1950 },
  { day: 'Sun', volume: 1640 },
];

export function RevenueChart({ grossVolume }: { grossVolume: number }) {
  const { t } = useLocale();
  const d = t.dashboard;

  return (
    <Card className="!p-5 md:col-span-2">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground/80">{d.volumeTrend}</h3>
          <p className="text-xs text-foreground-muted">{d.last7Days}</p>
        </div>
        <motion.span
          className="text-xs text-emerald-600 dark:text-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          +12.4%
        </motion.span>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'rgb(var(--foreground-muted))', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'rgb(var(--canvas-card))',
                border: '1px solid rgb(var(--border-rgb) / var(--border-alpha-strong))',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v) => [`${v ?? 0} ₾`, d.grossVolume]}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#volGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 font-mono text-xs text-foreground-muted">
        {d.grossVolume}: {grossVolume.toFixed(2)} ₾
      </p>
    </Card>
  );
}
