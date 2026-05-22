'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const CHARTS = [
  [
    { d: 'M', v: 40 },
    { d: 'T', v: 65 },
    { d: 'W', v: 52 },
    { d: 'T', v: 88 },
    { d: 'F', v: 120 },
    { d: 'S', v: 95 },
    { d: 'S', v: 140 },
  ],
  [
    { d: 'M', v: 80 },
    { d: 'T', v: 110 },
    { d: 'W', v: 95 },
    { d: 'T', v: 160 },
    { d: 'F', v: 200 },
    { d: 'S', v: 180 },
    { d: 'S', v: 240 },
  ],
  [
    { d: 'M', v: 120 },
    { d: 'T', v: 140 },
    { d: 'W', v: 130 },
    { d: 'T', v: 190 },
    { d: 'F', v: 220 },
    { d: 'S', v: 210 },
    { d: 'S', v: 260 },
  ],
];

export function DashboardPreviewChart({ viewIndex }: { viewIndex: number }) {
  const data = CHARTS[viewIndex] ?? CHARTS[0];

  return (
    <div className="mt-6 h-[220px] min-h-[220px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#previewGrad)"
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
