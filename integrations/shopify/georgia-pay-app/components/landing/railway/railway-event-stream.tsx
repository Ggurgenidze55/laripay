'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EVENTS = [
  { type: 'checkout.session.completed', ms: 38 },
  { type: 'payment.succeeded', ms: 41 },
  { type: 'payment.refunded', ms: 52 },
  { type: 'balance.updated', ms: 29 },
] as const;

type RowStatus = 'waiting' | 'typing' | 'sending' | 'done';
type Phase = 'events' | 'signature' | 'complete';

function Cursor() {
  return (
    <span
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-px animate-pulse bg-[#c4b5fd]"
      aria-hidden
    />
  );
}

export function RailwayEventStream({
  labels,
  active = false,
  onComplete,
}: {
  labels: {
    eventStream: string;
    delivering: string;
    sending: string;
    complete: string;
    allDelivered: string;
    signature: string;
  };
  active?: boolean;
  onComplete?: () => void;
}) {
  const [runId, setRunId] = useState(0);
  const completedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('events');
  const [activeIndex, setActiveIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [sendProgress, setSendProgress] = useState(0);
  const [rowStatus, setRowStatus] = useState<RowStatus[]>(EVENTS.map(() => 'waiting'));
  const [sigTyped, setSigTyped] = useState('');

  const fullSignature = labels.signature;
  const currentEvent = EVENTS[activeIndex];
  const headerLive = phase === 'complete';

  const resetStream = useCallback(() => {
    setPhase('events');
    setActiveIndex(0);
    setTyped('');
    setSendProgress(0);
    setRowStatus(EVENTS.map(() => 'waiting'));
    setSigTyped('');
  }, []);

  useEffect(() => {
    if (!active) return;
    completedRef.current = false;
    resetStream();
    setRunId((id) => id + 1);
  }, [active, resetStream]);

  useEffect(() => {
    if (phase === 'complete' && active && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [phase, active, onComplete]);

  useEffect(() => {
    if (!active) return;

    if (phase === 'events' && currentEvent) {
      const full = currentEvent.type;
      setRowStatus((prev) => {
        const next = [...prev];
        if (next[activeIndex] === 'waiting') next[activeIndex] = 'typing';
        return next;
      });

      if (typed.length < full.length) {
        const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 14);
        return () => clearTimeout(t);
      }

      if (sendProgress < 100) {
        setRowStatus((prev) => {
          const next = [...prev];
          next[activeIndex] = 'sending';
          return next;
        });
        const t = setTimeout(() => setSendProgress((p) => Math.min(100, p + 8)), 35);
        return () => clearTimeout(t);
      }

      setRowStatus((prev) => {
        const next = [...prev];
        next[activeIndex] = 'done';
        return next;
      });

      const t = setTimeout(() => {
        if (activeIndex + 1 < EVENTS.length) {
          setActiveIndex((i) => i + 1);
          setTyped('');
          setSendProgress(0);
        } else {
          setPhase('signature');
        }
      }, 420);
      return () => clearTimeout(t);
    }

    if (phase === 'signature') {
      if (sigTyped.length < fullSignature.length) {
        const t = setTimeout(() => setSigTyped(fullSignature.slice(0, sigTyped.length + 1)), 10);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('complete'), 500);
      return () => clearTimeout(t);
    }

  }, [active, runId, phase, activeIndex, typed, sendProgress, sigTyped, fullSignature, currentEvent]);

  const doneCount = rowStatus.filter((s) => s === 'done').length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0f0d14] shadow-[0_0_80px_-20px_rgba(139,92,246,0.35)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="font-mono text-[11px] text-[#71717a]">{labels.eventStream}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={headerLive ? 'complete' : 'delivering'}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
              headerLive
                ? 'border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#c4b5fd]'
                : 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                headerLive ? 'bg-[#a78bfa]' : active ? 'animate-pulse bg-[#4ade80]' : 'bg-[#4ade80]/60',
              )}
            />
            {headerLive ? labels.complete : labels.delivering}
          </motion.span>
        </AnimatePresence>
      </div>

      <ul className="divide-y divide-white/[0.04] p-2">
        {EVENTS.map((ev, i) => {
          const status = rowStatus[i];
          const isActive = phase === 'events' && i === activeIndex;
          const displayText =
            status === 'waiting'
              ? ''
              : status === 'typing' && isActive
                ? typed
                : ev.type;

          return (
            <li
              key={ev.type}
              className={cn(
                'relative overflow-hidden rounded-lg px-3 py-2.5 transition-colors',
                status === 'done' && 'bg-[#22c55e]/[0.06]',
                (status === 'typing' || status === 'sending') && isActive && 'bg-[#8b5cf6]/10',
                status === 'waiting' && 'opacity-40',
              )}
            >
              {status === 'sending' && isActive ? (
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-[#9333ea] to-[#c4b5fd]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: sendProgress / 100 }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                />
              ) : null}

              <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
                <span
                  className={cn(
                    'min-w-0 truncate',
                    status === 'done' && 'text-[#a7f3d0]',
                    (status === 'typing' || status === 'sending') && isActive && 'text-[#c4b5fd]',
                    status === 'waiting' && 'text-[#52525b]',
                  )}
                >
                  {status === 'waiting' ? (
                    <span className="text-[#3f3f46]">—</span>
                  ) : (
                    <>
                      {displayText}
                      {status === 'typing' && isActive ? <Cursor /> : null}
                    </>
                  )}
                </span>

                <span className="shrink-0 tabular-nums">
                  {status === 'done' ? (
                    <span className="flex items-center gap-1 text-[#4ade80]">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {ev.ms}ms
                    </span>
                  ) : status === 'sending' && isActive ? (
                    <span className="text-[#fbbf24]">{labels.sending}</span>
                  ) : status === 'typing' && isActive ? (
                    <span className="text-[#71717a]">…</span>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-white/[0.06] px-4 py-3">
        <p className="min-h-[1.25rem] font-mono text-[10px] text-[#71717a]">
          {phase === 'signature' || phase === 'complete' ? (
            <>
              {sigTyped}
              {phase === 'signature' ? <Cursor /> : null}
            </>
          ) : (
            <span className="text-[#3f3f46]">—</span>
          )}
        </p>
      </div>

      <AnimatePresence>
        {phase === 'complete' ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[#8b5cf6]/25 bg-[#8b5cf6]/10 px-4 py-2.5 text-center font-mono text-[10px] font-medium text-[#c4b5fd]"
          >
            ✓ {labels.allDelivered} · {doneCount}/{EVENTS.length}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
