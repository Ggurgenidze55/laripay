'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { useBelowLg } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
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

const VIEW_GLOW = [
  'from-accent-blue/25 via-accent-cyan/10 to-transparent',
  'from-emerald-500/20 via-accent-cyan/10 to-transparent',
  'from-accent-violet/25 via-accent-blue/10 to-transparent',
];

export function DashboardPreviewScroll() {
  const reduced = useReducedMotion();
  const belowLg = useBelowLg();
  const useScrollPin = !reduced && !belowLg;
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
  const [manualView, setManualView] = useState<number | null>(null);
  const view = VIEWS[manualView ?? viewIndex];

  const setView = (i: number) => {
    setManualView(i);
    setViewIndex(i);
  };

  useEffect(() => {
    if (!useScrollPin) return;
    registerGsap();
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        scrub: 0.4,
        onUpdate: (self) => {
          const idx = Math.min(2, Math.floor(self.progress * 3.001));
          setViewIndex(idx);
          setManualView(null);
        },
      });
    }, container);

    return () => ctx.revert();
  }, [useScrollPin]);

  const activeIdx = manualView ?? viewIndex;

  return (
    <SectionShell id="dashboard-preview" wide className="!py-0">
      <AmbientOrbs />
      <div
        ref={containerRef}
        className={cn('relative', useScrollPin ? 'min-h-[120vh]' : 'min-h-0')}
      >
        <div
          className={cn(
            'flex flex-col py-12 md:py-20',
            useScrollPin ? 'min-h-[min(100svh,900px)] justify-center' : 'justify-start',
          )}
        >
          <SectionHeader
            eyebrow={s.eyebrow}
            title={s.title}
            description={s.description}
            className="mx-auto"
          />

          <div className="relative mx-auto w-full max-w-5xl px-0">
            <motion.div
              className={cn(
                'pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br opacity-70 blur-3xl transition-all duration-700',
                VIEW_GLOW[activeIdx],
              )}
              animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <div className="relative overflow-hidden rounded-[1.85rem] border border-border-strong bg-surface-code shadow-lift glow-border">
              <div className="flex items-center gap-2 border-b border-border bg-canvas-elevated px-5 py-4">
                <span className="h-3 w-3 rounded-full bg-red-500/50" />
                <span className="h-3 w-3 rounded-full bg-amber-500/50" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/50" />
                <span className="ml-3 font-mono text-[11px] text-foreground-muted">console.laripay.ai</span>
                <div className="ml-auto flex gap-1.5">
                  {VIEWS.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setView(i)}
                      aria-label={v.title}
                      aria-pressed={activeIdx === i}
                      className={cn(
                        'relative h-2 overflow-hidden rounded-full transition-all duration-300',
                        activeIdx === i ? 'w-10 bg-accent-cyan' : 'w-6 bg-foreground/[0.08] hover:bg-foreground/15',
                      )}
                    >
                      {activeIdx === i && (
                        <motion.span
                          layoutId="console-tab"
                          className="absolute inset-0 rounded-full bg-accent-cyan shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 md:grid-cols-3 md:p-8">
                <div className="min-w-0 md:col-span-2">
                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={view.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35 }}
                      className="text-lg font-medium tracking-tight text-foreground"
                    >
                      {view.title}
                    </motion.h3>
                  </AnimatePresence>
                  <PreviewChart viewIndex={activeIdx} />
                </div>

                <div className="space-y-4">
                  <motion.div
                    key={`vol-${view.id}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'rounded-2xl border bg-canvas-card p-5 transition-colors duration-500',
                      activeIdx === 1
                        ? 'border-emerald-500/30 ring-1 ring-emerald-500/20'
                        : 'border-border-strong',
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                      {s.volume}
                    </p>
                    <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">
                      <AnimatedCounter value={view.volume} decimals={0} suffix=" ₾" />
                    </p>
                  </motion.div>
                  <motion.div
                    key={`pay-${view.id}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-border-strong bg-canvas-card p-5"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                      {s.payments}
                    </p>
                    <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">
                      <AnimatedCounter value={view.payments} />
                    </p>
                  </motion.div>
                  <AnimatePresence>
                    {activeIdx === 2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400"
                      >
                        <span className="relative flex items-center gap-2">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                          {s.webhooksStat}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {activeIdx === 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-border bg-accent-blue/5 px-6 py-4 font-mono text-[11px] text-foreground-muted"
                  >
                    <motion.span
                      animate={reduced ? undefined : { opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {s.livePayment}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-foreground-muted/80">
              {s.scrollHint}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {VIEWS.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(i)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-medium transition-all',
                    activeIdx === i
                      ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan shadow-glow'
                      : 'border-border-strong bg-canvas-card/60 text-foreground-muted hover:border-accent-blue/30',
                  )}
                >
                  {v.title}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {VIEWS.map((v, i) => (
                <span
                  key={v.id}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    activeIdx === i ? 'w-8 bg-accent-cyan' : 'w-2 bg-foreground/10',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
