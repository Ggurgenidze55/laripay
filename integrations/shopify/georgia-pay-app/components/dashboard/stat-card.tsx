'use client';

import { Card } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  suffix = '',
  decimals = 0,
  trend,
  pulse,
  className,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  trend?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('!p-5', className)} glow={pulse}>
      <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      {trend && <p className="mt-2 text-xs text-emerald-400/80">{trend}</p>}
      {pulse && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      )}
    </Card>
  );
}
