'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLandingPerformance } from '@/hooks/use-landing-performance';
import { cn } from '@/lib/utils';

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
  const { lite, reduced } = useLandingPerformance();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);

  const [pulseEdge, setPulseEdge] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [eventIdx, setEventIdx] = useState(0);
  const [txAmount, setTxAmount] = useState('24.50');

  const activeNode = useMemo(() => {
    if (hoveredNode !== null) return hoveredNode;
    const [a] = EDGES[pulseEdge];
    return a;
  }, [hoveredNode, pulseEdge]);

  const highlightedEdges = useMemo(() => {
    if (hoveredNode === null) return new Set([pulseEdge]);
    const set = new Set<number>();
    EDGES.forEach(([a, b], i) => {
      if (a === hoveredNode || b === hoveredNode) set.add(i);
    });
    return set;
  }, [hoveredNode, pulseEdge]);

  const focusNode = useCallback((id: number) => {
    if (lite) return;
    setHoveredNode(id);
    const edgeIdx = EDGES.findIndex(([a, b]) => a === id || b === id);
    if (edgeIdx >= 0) setPulseEdge(edgeIdx);
  }, [lite]);

  useEffect(() => {
    if (lite) return;
    const t = setInterval(() => {
      if (hoveredNode !== null) return;
      setPulseEdge((e) => (e + 1) % EDGES.length);
      setEventIdx((i) => (i + 1) % EVENTS.length);
      setTxAmount((24 + Math.random() * 180).toFixed(2));
    }, 2200);
    return () => clearInterval(t);
  }, [lite, hoveredNode]);

  const [flowA, flowB] = EDGES[pulseEdge];
  const flowFrom = NODES[flowA];
  const flowTo = NODES[flowB];

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (lite) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
        setHoveredNode(null);
      }}
      style={lite ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className="relative aspect-[4/3] w-full max-w-lg cursor-default select-none"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-violet/10 opacity-80" />

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {EDGES.map(([a, b], i) => {
          const n1 = NODES[a];
          const n2 = NODES[b];
          const active = highlightedEdges.has(i);
          return (
            <g key={`${a}-${b}`}>
              <motion.line
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="url(#lineGrad)"
                strokeWidth={active ? 0.55 : 0.14}
                strokeLinecap="round"
                animate={{ opacity: active ? 1 : 0.18 }}
                transition={{ duration: 0.3 }}
                className={active && !lite ? 'svg-edge-flow' : undefined}
              />
              {active && i === pulseEdge && !lite && (
                <motion.circle
                  r={0.9}
                  fill="#22d3ee"
                  filter="url(#nodeGlow)"
                  animate={{
                    cx: [n1.x, n2.x],
                    cy: [n1.y, n2.y],
                  }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </g>
          );
        })}

        {NODES.map((n) => {
          const active = n.id === activeNode || n.id === 0;
          const primary = n.id === activeNode;
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onMouseEnter={() => focusNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => focusNode(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') focusNode(n.id);
              }}
            >
              {primary && !lite && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={4}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={0.15}
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={primary ? 2.8 : 1.6}
                fill={primary ? '#22d3ee' : '#3b82f6'}
                animate={{
                  opacity: active ? 1 : 0.35,
                  scale: primary ? [1, 1.12, 1] : 1,
                }}
                transition={{ duration: primary ? 1.2 : 0.3, repeat: primary ? Infinity : 0 }}
                filter={primary ? 'url(#nodeGlow)' : undefined}
              />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="2.4"
                opacity={active ? 0.95 : 0.4}
                fontFamily="var(--font-mono)"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <motion.div
        animate={lite ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'absolute left-4 top-4 rounded-xl px-3.5 py-2.5 font-mono text-[10px]',
          'glass-panel glow-border ring-1 ring-accent-cyan/20',
        )}
      >
        <span className="text-foreground-muted">POST </span>
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
        className="absolute bottom-6 right-4 max-w-[160px] rounded-xl px-3.5 py-2.5 font-mono text-[10px] glass-panel ring-1 ring-emerald-500/20"
      >
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          live
        </div>
        <motion.div
          key={eventIdx}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-1 truncate text-foreground-muted"
        >
          {EVENTS[eventIdx]}
        </motion.div>
        <p className="mt-1.5 text-[9px] text-foreground-muted/60">
          {flowFrom.label} → {flowTo.label}
        </p>
      </motion.div>
    </motion.div>
  );
}
