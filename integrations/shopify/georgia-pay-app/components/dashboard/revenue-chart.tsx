'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

function buildSeries(gross: number) {
  const base = Math.max(gross, 100);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    volume: Math.round((base / 7) * (0.6 + Math.sin(i * 1.2) * 0.35 + i * 0.08)),
  }));
}

export function RevenueChart({ grossVolume }: { grossVolume: number }) {
  const data = buildSeries(grossVolume);

  return (
    <Card className="!p-5 lg:col-span-2" glow>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white/80">Volume trend</h3>
          <p className="text-xs text-white/35">Last 7 days · GEL</p>
        </div>
        <motion.span
          className="text-xs text-emerald-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ● live
        </motion.span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0f0f16',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#volGrad)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
