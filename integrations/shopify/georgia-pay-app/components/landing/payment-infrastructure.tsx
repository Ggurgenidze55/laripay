'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { useLocale } from '@/components/i18n/LocaleProvider';
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
  const { t } = useLocale();
  const s = t.landing.paymentInfrastructure;

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

  useEffect(() => {
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
  }, []);

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <SectionShell id="payment-flow" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <div
        ref={sectionRef}
        className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] border border-border-strong bg-canvas-card p-8 shadow-lift glow-border md:aspect-[2/1]"
      >
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
            return (
              <path
                key={`${a}-${b}`}
                ref={(el) => {
                  if (el) lineRefs.current[i] = el;
                }}
                d={`M ${n1.x} ${n1.y} Q ${(n1.x + n2.x) / 2} ${(n1.y + n2.y) / 2 - 8} ${n2.x} ${n2.y}`}
                fill="none"
                stroke="url(#flowGrad)"
                strokeWidth="0.4"
              />
            );
          })}
        </svg>

        {NODES.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute glass-panel rounded-xl px-3 py-2 font-mono text-[10px] text-foreground md:text-xs"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            {node.label}
          </motion.div>
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan shadow-[0_0_20px_#22d3ee]"
          animate={{ x: [0, 120, 0], y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ left: '35%', top: '28%' }}
        />
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {s.features.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border-strong bg-surface-inset px-6 py-5">
            <h4 className="font-medium text-foreground">{item.title}</h4>
            <p className="mt-2 text-sm text-foreground-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
