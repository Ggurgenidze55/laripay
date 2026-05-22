'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const NODES = [
  { id: 'merchant', label: 'Merchants', x: 12, y: 50 },
  { id: 'api', label: 'LariPay API', x: 35, y: 28 },
  { id: 'tbc', label: 'TBC Pay', x: 62, y: 18 },
  { id: 'bog', label: 'BOG Pay', x: 62, y: 72 },
  { id: 'webhook', label: 'Webhooks', x: 88, y: 38 },
  { id: 'settle', label: 'Settlement', x: 88, y: 62 },
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
      <SectionHeader
        eyebrow="Payment rails"
        title="Serious financial infrastructure"
        description="TBC Pay, BOG Pay, checkout sessions, refunds, and webhook delivery — one coherent system."
      />

      <div ref={sectionRef} className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-canvas-elevated/40 p-8 shadow-lift backdrop-blur-xl glow-border md:aspect-[2/1]">
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
                strokeWidth="0.25"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {NODES.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute glass-panel rounded-xl px-3 py-2 font-mono text-[10px] text-white/75 md:text-xs"
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
        {[
          { t: 'Checkout sessions', d: '30min TTL · idempotent create' },
          { t: 'Refunds', d: 'Partial & full · ledger sync' },
          { t: 'Settlement', d: 'Net volume · fee reporting' },
        ].map((item) => (
          <div
            key={item.t}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5"
          >
            <h4 className="font-medium text-white/85">{item.t}</h4>
            <p className="mt-2 text-sm text-white/40">{item.d}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
