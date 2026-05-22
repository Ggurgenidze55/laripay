'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Node = { id: number; x: number; y: number; label: string };

const NODES: Node[] = [
  { id: 0, x: 50, y: 28, label: 'API' },
  { id: 1, x: 22, y: 55, label: 'TBC' },
  { id: 2, x: 78, y: 52, label: 'BOG' },
  { id: 3, x: 38, y: 78, label: 'Shop' },
  { id: 4, x: 68, y: 76, label: 'Hook' },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [0, 4],
];

const EVENTS = [
  'checkout.session.created',
  'payment_intent.processing',
  'payment.succeeded',
  'webhook.delivered',
  'balance.updated',
];

export function PaymentNetwork() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-3, 3]);

  const [pulseEdge, setPulseEdge] = useState(0);
  const [activeNode, setActiveNode] = useState(0);
  const [eventIdx, setEventIdx] = useState(0);
  const [txAmount, setTxAmount] = useState('24.50');

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setPulseEdge((e) => {
        const next = (e + 1) % EDGES.length;
        const [a] = EDGES[next];
        setActiveNode(a);
        return next;
      });
      setEventIdx((i) => (i + 1) % EVENTS.length);
      setTxAmount((24 + Math.random() * 180).toFixed(2));
    }, 2000);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className="relative aspect-[4/3] w-full max-w-lg select-none"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {EDGES.map(([a, b], i) => {
          const n1 = NODES[a];
          const n2 = NODES[b];
          const active = i === pulseEdge;
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              stroke="url(#lineGrad)"
              strokeWidth={active ? 0.4 : 0.12}
              strokeLinecap="round"
              animate={{ opacity: active ? 1 : 0.25 }}
            />
          );
        })}
        {NODES.map((n) => {
          const active = n.id === activeNode || n.id === 0;
          return (
            <g key={n.id}>
              {active && !reduced && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={3}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={0.2}
                  animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={active ? 2.4 : 1.5}
                fill={active ? '#22d3ee' : '#3b82f6'}
                opacity={active ? 1 : 0.4}
              />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="2.4"
                opacity={active ? 0.9 : 0.45}
                fontFamily="var(--font-mono)"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-4 top-4 glass-panel glow-border rounded-xl px-3.5 py-2.5 font-mono text-[10px]"
      >
        <span className="text-white/35">POST </span>
        <span className="text-accent-cyan">/v1/checkout</span>
        <motion.div
          key={txAmount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-emerald-400"
        >
          200 OK · {txAmount} GEL
        </motion.div>
      </motion.div>

      <motion.div
        animate={reduced ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-6 right-4 max-w-[150px] glass-panel rounded-xl px-3.5 py-2.5 font-mono text-[10px]"
      >
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          live
        </div>
        <motion.div key={eventIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 truncate text-white/55">
          {EVENTS[eventIdx]}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
