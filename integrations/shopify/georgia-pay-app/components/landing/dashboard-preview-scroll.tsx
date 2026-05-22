'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { AnimatedCounter } from '@/components/motion/animated-counter';

const PreviewChart = dynamic(
  () => import('./dashboard-preview-chart').then((m) => m.DashboardPreviewChart),
  { ssr: false, loading: () => <div className="h-[220px] min-h-[220px] animate-pulse rounded-xl bg-white/5" /> },
);

const VIEWS = [
  { id: 'overview', title: 'Revenue overview', volume: 12840, payments: 342 },
  { id: 'live', title: 'Live transactions', volume: 14202, payments: 389 },
  { id: 'webhooks', title: 'Webhook health', volume: 14202, payments: 401 },
];

export function DashboardPreviewScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const view = VIEWS[viewIndex];

  useEffect(() => {
    registerGsap();
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: 0.4,
        onUpdate: (self) => {
          setViewIndex(Math.min(2, Math.floor(self.progress * 3.001)));
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <SectionShell id="dashboard-preview" wide className="!py-0">
      <AmbientOrbs />
      <div ref={containerRef} className="relative min-h-[200vh]">
        <div className="flex min-h-screen flex-col justify-center py-24">
          <SectionHeader
            eyebrow="Control center"
            title="Operational dashboard — realtime by design"
            description="Scroll to morph the console: analytics, live payments, webhook delivery."
          />

          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.85rem] border border-white/[0.1] bg-[#07070e]/95 shadow-lift backdrop-blur-2xl glow-border">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <span className="h-3 w-3 rounded-full bg-red-500/50" />
              <span className="h-3 w-3 rounded-full bg-amber-500/50" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/50" />
              <span className="ml-3 font-mono text-[11px] text-white/35">console.laripay.ai</span>
              <span className="ml-auto flex gap-1">
                {VIEWS.map((v, i) => (
                  <span
                    key={v.id}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i === viewIndex ? 'bg-accent-cyan' : 'bg-white/10'
                    }`}
                  />
                ))}
              </span>
            </div>

            <div className="grid gap-8 p-6 md:grid-cols-3 md:p-8">
              <div className="md:col-span-2">
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={view.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-lg font-medium tracking-tight text-white/92"
                  >
                    {view.title}
                  </motion.h3>
                </AnimatePresence>
                <PreviewChart viewIndex={viewIndex} />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/32">
                    Volume
                  </p>
                  <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">
                    <AnimatedCounter value={view.volume} decimals={0} suffix=" ₾" />
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/32">
                    Payments
                  </p>
                  <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">
                    <AnimatedCounter value={view.payments} />
                  </p>
                </div>
                <AnimatePresence>
                  {viewIndex === 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 font-mono text-xs text-emerald-400"
                    >
                      webhooks 99.97% · p99 118ms
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {viewIndex === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-white/[0.06] bg-accent-blue/5 px-6 py-4 font-mono text-[11px] text-white/50"
                >
                  <span className="text-emerald-400">●</span> pay_8a2f… · 24.50 GEL · succeeded · TBC ·
                  just now
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
