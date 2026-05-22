'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

const STROKES = ['#60a5fa', '#34d399', '#a78bfa'];
const FILLS = ['previewGrad0', 'previewGrad1', 'previewGrad2'];

export function DashboardPreviewChart({ viewIndex }: { viewIndex: number }) {
  const data = CHARTS[viewIndex] ?? CHARTS[0];
  const gradId = FILLS[viewIndex] ?? FILLS[0];
  const stroke = STROKES[viewIndex] ?? STROKES[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 h-[220px] min-h-[220px] w-full min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              {FILLS.map((id, i) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STROKES[i]} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={STROKES[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}
