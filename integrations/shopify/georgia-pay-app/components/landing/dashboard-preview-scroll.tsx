'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { AnimatedCounter } from '@/components/motion/animated-counter';

const PreviewChart = dynamic(
  () => import('./dashboard-preview-chart').then((m) => m.DashboardPreviewChart),
  { ssr: false, loading: () => <div className="h-[220px] min-h-[220px] animate-pulse rounded-xl bg-surface-inset" /> },
);

const VIEW_STATS = [
  { id: 'overview', volume: 12840, payments: 342 },
  { id: 'live', volume: 14202, payments: 389 },
  { id: 'webhooks', volume: 14202, payments: 401 },
];

export function DashboardPreviewScroll() {
  const { t } = useLocale();
  const s = t.landing.dashboardPreview;

  const VIEWS = useMemo(
    () =>
      VIEW_STATS.map((v, i) => ({
        ...v,
        title: s.views[i] ?? s.views[0],
      })),
    [s.views],
  );

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
          <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.85rem] border border-border-strong bg-surface-code shadow-lift glow-border">
            <div className="flex items-center gap-2 border-b border-border bg-canvas-elevated px-5 py-4">
              <span className="h-3 w-3 rounded-full bg-red-500/50" />
              <span className="h-3 w-3 rounded-full bg-amber-500/50" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/50" />
              <span className="ml-3 font-mono text-[11px] text-foreground-muted">console.laripay.ai</span>
              <span className="ml-auto flex gap-1">
                {VIEWS.map((v, i) => (
                  <span
                    key={v.id}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i === viewIndex ? 'bg-accent-cyan' : 'bg-foreground/[0.08]'
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
                    className="text-lg font-medium tracking-tight text-foreground"
                  >
                    {view.title}
                  </motion.h3>
                </AnimatePresence>
                <PreviewChart viewIndex={viewIndex} />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border-strong bg-canvas-card p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    {s.volume}
                  </p>
                  <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">
                    <AnimatedCounter value={view.volume} decimals={0} suffix=" ₾" />
                  </p>
                </div>
                <div className="rounded-2xl border border-border-strong bg-canvas-card p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    {s.payments}
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
                      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {s.webhooksStat}
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
                  className="overflow-hidden border-t border-border bg-accent-blue/5 px-6 py-4 font-mono text-[11px] text-foreground-muted"
                >
                  {s.livePayment}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
