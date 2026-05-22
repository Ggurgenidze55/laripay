'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

const STEP_NODES = ['API', 'TBC', 'BOG', 'Webhook'] as const;
const ORBIT_NODES = ['API', 'TBC', 'BOG', 'Webhook', 'Ledger'];

export function InfrastructureScroll() {
  const { t } = useLocale();
  const s = t.landing.infrastructure;
  const STEPS = useMemo(
    () =>
      s.steps.map((step, i) => ({
        ...step,
        label: `0${i + 1}`,
        node: STEP_NODES[i] ?? 'API',
      })),
    [s.steps],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
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
  }, [STEPS.length]);

  const activeNode = STEPS[activeStep]?.node ?? 'API';

  return (
    <SectionShell id="infrastructure" wide className="!border-t-0 !py-0">
      <AmbientOrbs />
      <div ref={containerRef} className="relative min-h-[280vh]">
        <div ref={pinRef} className="flex min-h-screen items-center py-24">
          <div className="grid w-full gap-20 lg:grid-cols-2 lg:gap-28">
            <div>
              <SectionHeader align="left" eyebrow={s.eyebrow} title={s.title} description={s.description} />
              <div className="relative mt-14 h-1 overflow-hidden rounded-full bg-foreground/[0.04]">
                <div
                  ref={progressRef}
                  className="h-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-violet"
                />
              </div>
              <div className="mt-20 space-y-6">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.label}
                    animate={{
                      opacity: activeStep === i ? 1 : 0.35,
                      x: activeStep === i ? 0 : -4,
                    }}
                    transition={{ duration: 0.35 }}
                    className={cn(
                      'rounded-2xl border-l-2 py-4 pl-8 pr-4 transition-colors',
                      activeStep === i
                        ? 'border-accent-cyan bg-surface-inset'
                        : 'border-border-strong bg-transparent',
                    )}
                  >
                    <span className="font-mono text-xs text-accent-cyan/90">{step.label}</span>
                    <h3 className="mt-2 text-xl font-medium tracking-tight text-foreground">{step.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">{step.body}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-[420px]">
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent-blue/25"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-10 rounded-full border border-dashed border-border-strong"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
                />
                {ORBIT_NODES.map((node, i) => {
                  const angle = (i / ORBIT_NODES.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 50 + Math.cos(angle) * 40;
                  const y = 50 + Math.sin(angle) * 40;
                  const isActive = node === activeNode || (activeNode === 'TBC' && node === 'API');
                  const isPrimary = node === activeNode;
                  return (
                    <motion.div
                      key={node}
                      className={cn(
                        'absolute rounded-xl px-3.5 py-2.5 font-mono text-[11px] backdrop-blur-xl transition-shadow',
                        isPrimary
                          ? 'glass-panel glow-border text-foreground shadow-glow'
                          : 'border border-border-strong bg-canvas-card text-foreground-muted shadow-card',
                      )}
                      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                      animate={{ scale: isPrimary ? 1.08 : 1 }}
                    >
                      {node}
                    </motion.div>
                  );
                })}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeNode}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">{activeNode}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
