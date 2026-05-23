'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { useViewport } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const NODE_LAYOUT = [
  { id: 'merchant', key: 'merchants' as const, x: 12, y: 50 },
  { id: 'api', key: 'api' as const, x: 35, y: 28 },
  { id: 'tbc', key: 'tbc' as const, x: 62, y: 18 },
  { id: 'bog', key: 'bog' as const, x: 62, y: 72 },
  { id: 'webhook', key: 'webhooks' as const, x: 88, y: 38 },
  { id: 'settle', key: 'settlement' as const, x: 88, y: 62 },
];

const EDGES: [string, string][] = [
  ['merchant', 'api'],
  ['api', 'tbc'],
  ['api', 'bog'],
  ['api', 'webhook'],
  ['tbc', 'settle'],
  ['bog', 'settle'],
  ['webhook', 'merchant'],
];

export function PaymentInfrastructure() {
  const reduced = useReducedMotion();
  const { belowLg, ready } = useViewport();
  const { t } = useLocale();
  const s = t.landing.paymentInfrastructure;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const NODES = useMemo(
    () =>
      NODE_LAYOUT.map((n) => ({
        id: n.id,
        label: s.nodes[n.key],
        x: n.x,
        y: n.y,
      })),
    [s.nodes],
  );

  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<SVGPathElement[]>([]);

  const connectedIds = useMemo(() => {
    if (!hoveredId) return null;
    const ids = new Set<string>([hoveredId]);
    EDGES.forEach(([a, b]) => {
      if (a === hoveredId || b === hoveredId) {
        ids.add(a);
        ids.add(b);
      }
    });
    return ids;
  }, [hoveredId]);

  const edgeActive = useCallback(
    (a: string, b: string) => {
      if (!connectedIds) return true;
      return connectedIds.has(a) && connectedIds.has(b);
    },
    [connectedIds],
  );

  useEffect(() => {
    if (!ready || reduced || belowLg) return;
    registerGsap();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      lineRefs.current.forEach((path, i) => {
        if (!path) return;
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          scrollTrigger: {
            trigger: section,
            start: `top ${70 - i * 8}%`,
            end: 'bottom 30%',
            scrub: 1,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, [ready, reduced, belowLg]);

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <SectionShell id="payment-flow" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <div
        ref={sectionRef}
        className="group relative mx-auto aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border-strong bg-canvas-card p-6 shadow-lift glow-border sm:p-8 md:aspect-[2/1]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_35%_28%,rgba(34,211,238,0.12),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {EDGES.map(([a, b], i) => {
            const n1 = nodeMap[a];
            const n2 = nodeMap[b];
            const active = edgeActive(a, b);
            return (
              <path
                key={`${a}-${b}`}
                ref={(el) => {
                  if (el) lineRefs.current[i] = el;
                }}
                d={`M ${n1.x} ${n1.y} Q ${(n1.x + n2.x) / 2} ${(n1.y + n2.y) / 2 - 8} ${n2.x} ${n2.y}`}
                fill="none"
                stroke="url(#flowGrad)"
                strokeWidth={active ? 0.55 : 0.15}
                style={{ opacity: active ? 1 : 0.2, transition: 'opacity 0.35s, stroke-width 0.35s' }}
                className={active && !reduced && !hoveredId ? 'svg-edge-flow' : undefined}
              />
            );
          })}
        </svg>

        {NODES.map((node, i) => {
          const lit = !connectedIds || connectedIds.has(node.id);
          const primary = hoveredId === node.id;
          return (
            <motion.button
              key={node.id}
              type="button"
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(node.id)}
              onBlur={() => setHoveredId(null)}
              className={cn(
                'absolute z-10 max-w-[44%] truncate rounded-lg px-2 py-1.5 font-mono text-[9px] sm:max-w-none sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] md:text-xs',
                'border backdrop-blur-md transition-all duration-300',
                primary
                  ? 'border-accent-cyan/50 bg-canvas-elevated text-foreground shadow-glow ring-2 ring-accent-cyan/30'
                  : lit
                    ? 'glass-panel border-border-strong text-foreground'
                    : 'border-border-strong/60 bg-canvas-card/60 text-foreground-muted',
              )}
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              {node.label}
            </motion.button>
          );
        })}

        {!reduced && !belowLg && (
          <motion.div
            className="pointer-events-none absolute h-3 w-3 rounded-full bg-accent-cyan shadow-[0_0_24px_#22d3ee]"
            animate={{
              left: ['12%', '35%', '62%', '88%', '62%', '35%', '12%'],
              top: ['50%', '28%', '18%', '38%', '72%', '28%', '50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        )}
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        {s.features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.08 }}
            whileHover={reduced ? undefined : { y: -4 }}
            className="landing-card-interactive rounded-2xl border border-border-strong bg-surface-inset px-6 py-5"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 font-mono text-xs text-accent-cyan">
              {String(i + 1).padStart(2, '0')}
            </div>
            <h4 className="font-medium text-foreground">{item.title}</h4>
            <p className="mt-2 text-sm text-foreground-muted">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
