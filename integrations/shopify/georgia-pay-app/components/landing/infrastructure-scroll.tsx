'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { cn } from '@/lib/utils';
import { useBelowLg } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const ORBIT_NODES = ['API', 'TBC', 'BOG', 'Webhook', 'Ledger'] as const;

/** Which orbit nodes light up per lifecycle step */
const STEP_HIGHLIGHTS: readonly (typeof ORBIT_NODES)[number][][] = [
  ['API'],
  ['API', 'TBC'],
  ['TBC', 'BOG'],
  ['Webhook', 'Ledger'],
];

function orbitPosition(i: number, total: number) {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * 40,
    y: 50 + Math.sin(angle) * 40,
  };
}

export function InfrastructureScroll() {
  const reduced = useReducedMotion();
  const belowLg = useBelowLg();
  const useScrollPin = !reduced && !belowLg;
  const { t } = useLocale();
  const s = t.landing.infrastructure;
  const STEPS = useMemo(
    () =>
      s.steps.map((step, i) => ({
        ...step,
        label: `0${i + 1}`,
        highlights: STEP_HIGHLIGHTS[i] ?? ['API'],
      })),
    [s.steps],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [manualStep, setManualStep] = useState<number | null>(null);

  const effectiveStep = manualStep ?? activeStep;
  const highlights = STEPS[effectiveStep]?.highlights ?? ['API'];
  const primaryNode = highlights[0];

  const goToStep = useCallback(
    (i: number) => {
      setManualStep(i);
      setActiveStep(i);
      if (!useScrollPin) return;
      const container = containerRef.current;
      if (!container) return;
      const st = ScrollTrigger.getAll().find((t) => t.trigger === container);
      if (!st) return;
      const y = st.start + ((st.end - st.start) * (i + 0.45)) / STEPS.length;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    },
    [STEPS.length, reduced, useScrollPin],
  );

  useEffect(() => {
    if (!useScrollPin) return;
    registerGsap();
    const container = containerRef.current;
    const pin = pinRef.current;
    if (!container || !pin) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=260%',
        pin: pin,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
          setActiveStep(idx);
          setManualStep(null);
        },
      });

      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: '+=260%',
            scrub: true,
          },
        });
      }
    }, container);

    return () => ctx.revert();
  }, [STEPS.length, useScrollPin]);

  return (
    <SectionShell id="infrastructure" wide className="!border-t-0 !py-0">
      <AmbientOrbs />
      <div
        ref={containerRef}
        className={cn('relative', useScrollPin ? 'min-h-[280vh]' : 'min-h-0')}
      >
        <div
          ref={pinRef}
          className={cn(
            'flex flex-col py-12 md:py-16',
            useScrollPin ? 'min-h-screen items-center' : 'items-stretch',
          )}
        >
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-28">
            <div className="order-2 lg:order-1">
              <SectionHeader align="left" eyebrow={s.eyebrow} title={s.title} description={s.description} />
              <div className="relative mt-14 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-violet"
                  animate={{ width: `${((effectiveStep + 1) / STEPS.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                />
                <div
                  ref={progressRef}
                  className="h-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-violet opacity-0"
                />
              </div>
              <div className="mt-20 space-y-4">
                {STEPS.map((step, i) => (
                  <motion.button
                    key={step.label}
                    type="button"
                    onClick={() => goToStep(i)}
                    animate={{
                      opacity: effectiveStep === i ? 1 : 0.4,
                      x: effectiveStep === i ? 0 : -6,
                      scale: effectiveStep === i ? 1 : 0.98,
                    }}
                    whileHover={{ opacity: 0.85, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className={cn(
                      'w-full rounded-2xl border-l-2 py-4 pl-8 pr-4 text-left transition-colors',
                      effectiveStep === i
                        ? 'border-accent-cyan bg-surface-inset shadow-glow ring-1 ring-accent-cyan/15'
                        : 'border-border-strong bg-transparent hover:border-accent-blue/40 hover:bg-foreground/[0.02]',
                    )}
                  >
                    <span className="font-mono text-xs text-accent-cyan/90">{step.label}</span>
                    <h3 className="mt-2 text-xl font-medium tracking-tight text-foreground">{step.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">{step.body}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="order-1 flex flex-col items-center justify-center lg:order-2">
              <div className="relative aspect-square w-full max-w-[420px]">
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent-blue/30"
                  animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                  transition={{
                    rotate: { duration: 48, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />
                <motion.div
                  className="absolute inset-10 rounded-full border border-dashed border-border-strong"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
                />

                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="spokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx={50}
                    cy={50}
                    r={6}
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.15)"
                    strokeWidth={0.2}
                  />
                  {ORBIT_NODES.map((node, i) => {
                    const { x, y } = orbitPosition(i, ORBIT_NODES.length);
                    const lit = highlights.includes(node);
                    return (
                      <motion.line
                        key={node}
                        x1={50}
                        y1={50}
                        x2={x}
                        y2={y}
                        stroke="url(#spokeGrad)"
                        strokeWidth={lit ? 0.35 : 0.1}
                        strokeLinecap="round"
                        animate={{ opacity: lit ? 1 : 0.12 }}
                        transition={{ duration: 0.4 }}
                        className={lit && !reduced ? 'svg-edge-flow' : undefined}
                      />
                    );
                  })}
                  {!reduced && (() => {
                    const idx = Math.max(0, ORBIT_NODES.indexOf(primaryNode));
                    const hub = orbitPosition(idx, ORBIT_NODES.length);
                    return (
                      <motion.circle
                        r={1.2}
                        fill="#22d3ee"
                        animate={{ cx: hub.x, cy: hub.y }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                      />
                    );
                  })()}
                </svg>

                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                  <motion.div
                    className="flex size-14 shrink-0 items-center justify-center rounded-full border border-accent-cyan/40 bg-canvas-card/90 font-mono text-[10px] uppercase tracking-wide text-accent-cyan shadow-glow backdrop-blur-md"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ transformOrigin: 'center center' }}
                  >
                    hub
                  </motion.div>
                </div>

                {ORBIT_NODES.map((node, i) => {
                  const { x, y } = orbitPosition(i, ORBIT_NODES.length);
                  const isPrimary = node === primaryNode;
                  const isLit = highlights.includes(node);
                  return (
                    <motion.button
                      key={node}
                      type="button"
                      onClick={() => {
                        const stepIdx = STEP_HIGHLIGHTS.findIndex((h) => h.includes(node));
                        if (stepIdx >= 0) goToStep(stepIdx);
                      }}
                      className={cn(
                        'absolute z-20 rounded-xl px-3.5 py-2.5 font-mono text-[11px] backdrop-blur-xl transition-shadow',
                        isPrimary
                          ? 'glass-panel glow-border text-foreground shadow-glow ring-2 ring-accent-cyan/40'
                          : isLit
                            ? 'border border-accent-cyan/30 bg-canvas-card text-foreground shadow-card'
                            : 'border border-border-strong bg-canvas-card/80 text-foreground-muted shadow-card',
                      )}
                      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                      animate={{ scale: isPrimary ? 1.1 : isLit ? 1.04 : 1 }}
                      whileHover={{ scale: isPrimary ? 1.14 : 1.08 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    >
                      {node}
                    </motion.button>
                  );
                })}

              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={primaryNode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-accent-cyan/80"
                >
                  {primaryNode}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
