'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = { title: string; body: string };
type PayInfra = {
  eyebrow: string;
  title: string;
  description: string;
  nodes: Record<'merchants' | 'api' | 'tbc' | 'bog' | 'webhooks' | 'settlement', string>;
  features: readonly { title: string; desc: string }[];
};

const NODE_KEYS = ['merchants', 'api', 'tbc', 'bog', 'webhooks', 'settlement'] as const;
type NodeKey = (typeof NODE_KEYS)[number];

/** Exact route edges drawn per step (order = draw + pulse sequence) */
const STEP_ROUTES: readonly {
  edges: readonly (readonly [NodeKey, NodeKey])[];
  nodes: readonly NodeKey[];
}[] = [
  { edges: [['merchants', 'api']], nodes: ['merchants', 'api'] },
  {
    edges: [
      ['merchants', 'api'],
      ['api', 'tbc'],
      ['api', 'bog'],
    ],
    nodes: ['merchants', 'api', 'tbc', 'bog'],
  },
  {
    edges: [
      ['tbc', 'settlement'],
      ['bog', 'settlement'],
    ],
    nodes: ['tbc', 'bog', 'settlement'],
  },
  {
    edges: [
      ['api', 'webhooks'],
      ['webhooks', 'merchants'],
    ],
    nodes: ['api', 'webhooks', 'merchants'],
  },
];

const ALL_EDGES: readonly (readonly [NodeKey, NodeKey])[] = [
  ['merchants', 'api'],
  ['api', 'tbc'],
  ['api', 'bog'],
  ['tbc', 'settlement'],
  ['bog', 'settlement'],
  ['api', 'webhooks'],
  ['webhooks', 'merchants'],
];

/** Grid placement — lines are drawn from measured box edges, not these cells */
const NODE_GRID: Record<NodeKey, string> = {
  merchants: 'col-start-1 row-start-2 justify-self-end self-center',
  api: 'col-start-2 row-start-2 justify-self-center self-center',
  tbc: 'col-start-3 row-start-1 justify-self-center self-center',
  bog: 'col-start-3 row-start-3 justify-self-center self-center',
  webhooks: 'col-start-4 row-start-1 justify-self-start self-center',
  settlement: 'col-start-4 row-start-3 justify-self-start self-center',
};

type MeasuredRect = { left: number; top: number; width: number; height: number };
type Point = { x: number; y: number };
type LineEndpoints = { x1: number; y1: number; x2: number; y2: number };

function edgeKey(from: NodeKey, to: NodeKey) {
  return `${from}-${to}`;
}

function isRouteEdge(routeEdges: readonly (readonly [NodeKey, NodeKey])[], from: NodeKey, to: NodeKey) {
  return routeEdges.some(([f, t]) => f === from && t === to);
}

function rectCenter(r: MeasuredRect): Point {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Where a ray from rect center toward `target` exits the rectangle border */
function rectBorderToward(rect: MeasuredRect, target: Point): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };

  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const scale = Math.min(Math.abs(hw / dx), Math.abs(hh / dy));
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function connectorEndpoints(from: MeasuredRect, to: MeasuredRect): LineEndpoints {
  const toCenter = rectCenter(to);
  const fromCenter = rectCenter(from);
  const start = rectBorderToward(from, toCenter);
  const end = rectBorderToward(to, fromCenter);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

function lineLength(line: LineEndpoints) {
  return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
}

function buildPulseSegments(
  routeEdges: readonly (readonly [NodeKey, NodeKey])[],
  getLine: (from: NodeKey, to: NodeKey) => LineEndpoints | null,
) {
  const segments: Point[][] = [];
  let current: Point[] = [];

  for (const [from, to] of routeEdges) {
    const line = getLine(from, to);
    if (!line) continue;
    const a = { x: line.x1, y: line.y1 };
    const b = { x: line.x2, y: line.y2 };
    if (current.length === 0) {
      current = [a, b];
      continue;
    }
    const last = current[current.length - 1];
    if (Math.hypot(last.x - a.x, last.y - a.y) < 3) {
      current.push(b);
    } else {
      segments.push(current);
      current = [a, b];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

const STEP_SNIPPETS = [
  `$ laripay keys create --live\n→ sk_live_… · whsec_…\n→ webhooks endpoint verified`,
  `POST /v1/checkout/sessions\n{\n  "amount": 2450,\n  "currency": "GEL"\n}\n→ 201 redirect_url`,
  `payment.authorized\nbank: TBC · 2450.00 GEL\nfee: 24.50 GEL · net: 2425.50 GEL`,
  `checkout.session.completed\npayment.succeeded\n→ webhook.delivered 200 OK (38ms)`,
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">{children}</p>
  );
}

function FlowDiagram({
  nodes,
  activeStep,
}: {
  nodes: PayInfra['nodes'];
  activeStep: number;
}) {
  const route = STEP_ROUTES[activeStep] ?? STEP_ROUTES[0];
  const routeEdges = route.edges;
  const activeNodes = route.nodes;

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Partial<Record<NodeKey, HTMLDivElement>>>({});
  const [layout, setLayout] = useState<{
    size: { w: number; h: number };
    rects: Partial<Record<NodeKey, MeasuredRect>>;
  } | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cr = container.getBoundingClientRect();
    if (cr.width < 1 || cr.height < 1) return;

    const rects: Partial<Record<NodeKey, MeasuredRect>> = {};
    for (const key of NODE_KEYS) {
      const el = nodeRefs.current[key];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      rects[key] = {
        left: r.left - cr.left,
        top: r.top - cr.top,
        width: r.width,
        height: r.height,
      };
    }

    setLayout({ size: { w: cr.width, h: cr.height }, rects });
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, activeStep, nodes]);

  const getLine = useCallback(
    (from: NodeKey, to: NodeKey): LineEndpoints | null => {
      if (!layout?.rects[from] || !layout.rects[to]) return null;
      return connectorEndpoints(layout.rects[from]!, layout.rects[to]!);
    },
    [layout],
  );

  const label = (key: NodeKey) => {
    const map: Record<NodeKey, string> = {
      merchants: nodes.merchants,
      api: nodes.api,
      tbc: nodes.tbc,
      bog: nodes.bog,
      webhooks: nodes.webhooks,
      settlement: nodes.settlement,
    };
    return map[key];
  };

  const pulseSegments = layout ? buildPulseSegments(routeEdges, getLine) : [];
  const pulseDuration = 1.35;
  const ready = layout && NODE_KEYS.every((k) => layout.rects[k]);

  return (
    <motion.div
      key={activeStep}
      ref={containerRef}
      className="relative mt-6 h-[196px] overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 sm:h-[220px]"
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(139,92,246,0.12),transparent)]" />

      {ready ? (
        <svg
          className="pointer-events-none absolute inset-0 z-0"
          width={layout.size.w}
          height={layout.size.h}
          viewBox={`0 0 ${layout.size.w} ${layout.size.h}`}
          aria-hidden
        >
          <defs>
            <linearGradient id={`routeGrad-${activeStep}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={layout.size.w} y2="0">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>

          {ALL_EDGES.map(([from, to]) => {
            if (isRouteEdge(routeEdges, from, to)) return null;
            const line = getLine(from, to);
            if (!line) return null;
            return (
              <line
                key={`bg-${edgeKey(from, to)}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#3f3f46"
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.25}
              />
            );
          })}

          {routeEdges.map(([from, to], i) => {
            const line = getLine(from, to);
            if (!line) return null;
            const len = lineLength(line);
            const drawDelay = i * 0.38;

            return (
              <g key={`${activeStep}-${edgeKey(from, to)}`}>
                <motion.line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#8b5cf6"
                  strokeWidth={5}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: len, opacity: 0 }}
                  animate={{ strokeDashoffset: 0, opacity: 0.18 }}
                  transition={{ duration: 0.55, delay: drawDelay, ease: EASE }}
                  style={{ strokeDasharray: len }}
                />
                <motion.line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={`url(#routeGrad-${activeStep})`}
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: len, opacity: 0.35 }}
                  animate={{ strokeDashoffset: 0, opacity: 1 }}
                  transition={{ duration: 0.55, delay: drawDelay, ease: EASE }}
                  style={{ strokeDasharray: len }}
                />
              </g>
            );
          })}

          {pulseSegments.map((points, segIdx) => {
            if (points.length < 2) return null;
            const times = points.map((_, idx) => idx / (points.length - 1));
            return (
              <motion.circle
                key={`pulse-${activeStep}-${segIdx}`}
                r={4}
                fill="#e9d5ff"
                initial={{ cx: points[0].x, cy: points[0].y, opacity: 0 }}
                animate={{
                  cx: points.map((p) => p.x),
                  cy: points.map((p) => p.y),
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: pulseDuration,
                  delay: segIdx * 0.25,
                  repeat: Infinity,
                  ease: 'linear',
                  times,
                }}
              />
            );
          })}
        </svg>
      ) : null}

      <div className="relative z-10 grid h-full grid-cols-4 grid-rows-3 gap-1 px-2 py-3 sm:px-4 sm:py-4">
        {NODE_KEYS.map((key) => {
          const lit = activeNodes.includes(key);
          const isStart = routeEdges[0]?.[0] === key;
          const isEnd =
            routeEdges[routeEdges.length - 1]?.[1] === key ||
            (activeStep === 1 && (key === 'tbc' || key === 'bog'));
          const pulse = lit && (isStart || isEnd);

          return (
            <div key={key} className={NODE_GRID[key]}>
              <motion.div
                ref={(el) => {
                  if (el) nodeRefs.current[key] = el;
                }}
                className={cn(
                  'rounded-lg border px-2 py-1 font-mono text-[9px] sm:text-[10px]',
                  lit
                    ? 'border-[#8b5cf6]/55 bg-[#8b5cf6]/18 text-[#e9d5ff] shadow-[0_0_20px_-6px_rgba(139,92,246,0.65)]'
                    : 'border-white/[0.06] bg-[#13111a]/90 text-[#3f3f46]',
                )}
                animate={{ scale: pulse ? 1.05 : lit ? 1 : 0.96, opacity: lit ? 1 : 0.45 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                {pulse && lit ? (
                  <span className="relative flex items-center gap-1 whitespace-nowrap">
                    <span className="absolute -left-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-[#a78bfa] opacity-60" />
                    {label(key)}
                  </span>
                ) : (
                  <span className="whitespace-nowrap">{label(key)}</span>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function RailwayHowItWorks({
  infra,
  payInfra,
}: {
  infra: {
    eyebrow: string;
    title: string;
    description: string;
    steps: readonly Step[];
  };
  payInfra: PayInfra;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const goToStep = useCallback((i: number) => {
    setActiveStep(Math.max(0, Math.min(infra.steps.length - 1, i)));
  }, [infra.steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToStep(activeStep + 1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToStep(activeStep - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStep, goToStep]);

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <SectionLabel>{infra.eyebrow}</SectionLabel>
          <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-[-0.03em] text-white">
            {infra.title}
          </h2>
          <p className="mt-4 text-[#a1a1aa]">{infra.description}</p>
        </motion.div>

        {/* Step pills + progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <motion.div
            className="relative h-1 overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuenow={activeStep + 1}
            aria-valuemin={1}
            aria-valuemax={infra.steps.length}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9333ea] to-[#6366f1]"
              animate={{ width: `${((activeStep + 1) / infra.steps.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </motion.div>
          <motion.div className="mt-4 flex flex-wrap justify-center gap-2">
            {infra.steps.map((step, i) => (
              <motion.button
                key={step.title}
                type="button"
                onClick={() => goToStep(i)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-left text-xs font-medium transition-colors sm:px-4 sm:text-[13px]',
                  activeStep === i
                    ? 'border-[#8b5cf6]/50 bg-[#8b5cf6]/15 text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.7)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#71717a] hover:border-white/15 hover:text-[#a1a1aa]',
                )}
              >
                <span className="font-mono text-[10px] text-[#8b5cf6]">{String(i + 1).padStart(2, '0')}</span>
                <span className="ml-2 hidden sm:inline">{step.title}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          {/* Main interactive panel */}
          <motion.div
            layout
            className="relative overflow-hidden rounded-2xl border border-[#8b5cf6]/25 bg-gradient-to-br from-[#8b5cf6]/15 via-[#13111a] to-[#0f0d14] p-6 sm:p-8 lg:col-span-7 lg:row-span-2"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
            <SectionLabel>{payInfra.eyebrow}</SectionLabel>
            <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">{payInfra.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a1a1aa]">{payInfra.description}</p>

            <FlowDiagram nodes={payInfra.nodes} activeStep={activeStep} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0a10]/80"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                  <span className="font-mono text-[10px] text-[#71717a]">step {String(activeStep + 1).padStart(2, '0')} · live</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" />
                    <span className="font-mono text-[10px] text-[#4ade80]">running</span>
                  </span>
                </div>
                <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-[#c4b5fd] sm:text-xs">
                  {STEP_SNIPPETS[activeStep]}
                </pre>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {payInfra.features.map((f, i) => (
                <motion.div
                  key={f.title}
                  onHoverStart={() => setHoveredFeature(i)}
                  onHoverEnd={() => setHoveredFeature(null)}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className={cn(
                    'cursor-default rounded-xl border p-4 transition-colors',
                    hoveredFeature === i
                      ? 'border-[#8b5cf6]/40 bg-[#8b5cf6]/10'
                      : 'border-white/[0.08] bg-black/20',
                  )}
                >
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-xs text-[#71717a]">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Step cards */}
          {infra.steps.slice(0, 2).map((step, i) => (
            <StepCard
              key={step.title}
              index={i}
              step={step}
              active={activeStep === i}
              onSelect={() => goToStep(i)}
              className="lg:col-span-5"
            />
          ))}

          {infra.steps.slice(2).map((step, i) => (
            <StepCard
              key={step.title}
              index={i + 2}
              step={step}
              active={activeStep === i + 2}
              onSelect={() => goToStep(i + 2)}
              className="lg:col-span-6"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  index,
  step,
  active,
  onSelect,
  className,
}: {
  index: number;
  step: Step;
  active: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.08 + index * 0.05 }}
      whileHover={{ y: active ? 0 : -4, scale: active ? 1 : 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border p-6 text-left transition-shadow',
        active
          ? 'border-[#8b5cf6]/45 bg-[#13111a] shadow-[0_0_40px_-12px_rgba(139,92,246,0.55)]'
          : 'border-white/[0.08] bg-[#13111a]/80 hover:border-white/15 hover:bg-[#13111a]',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-0.5 transition-colors',
          active ? 'bg-[#8b5cf6]' : 'bg-transparent group-hover:bg-white/20',
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'font-mono text-xs font-bold transition-colors',
            active ? 'text-[#c4b5fd]' : 'text-[#8b5cf6]',
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {active ? (
          <motion.span
            layoutId="step-active-dot"
            className="mt-0.5 flex h-2 w-2 rounded-full bg-[#a78bfa]"
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        ) : (
          <span className="mt-0.5 h-2 w-2 rounded-full border border-white/15 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <h3 className={cn('mt-3 font-semibold transition-colors', active ? 'text-white' : 'text-[#e4e4e7]')}>
        {step.title}
      </h3>
      <p className={cn('mt-2 text-sm leading-relaxed transition-colors', active ? 'text-[#a1a1aa]' : 'text-[#71717a]')}>
        {step.body}
      </p>
    </motion.button>
  );
}
