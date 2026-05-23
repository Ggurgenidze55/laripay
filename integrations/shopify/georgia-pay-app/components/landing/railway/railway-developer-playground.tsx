'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const SNIPPETS = [
  `npm install @laripay/sdk

const session = await laripay.checkout.create({
  amount: 2450,
  currency: 'GEL',
});`,
  `pip install laripay

session = laripay.checkout.create(
  amount=2450,
  currency="GEL",
)`,
  `composer require laripay/sdk

$session = $laripay->checkout->create([
  'amount' => 2450,
  'currency' => 'GEL',
]);`,
  `curl -X POST https://api.laripay.ai/v1/checkout/sessions \\
  -H "Authorization: Bearer sk_..." \\
  -d '{"amount":2450,"currency":"GEL"}'`,
] as const;

const RESPONSE = `{
  "id": "cs_a1b2c3d4",
  "object": "checkout.session",
  "amount": 2450,
  "currency": "GEL",
  "status": "succeeded",
  "payment_id": "pay_9f2c…"
}`;

type Phase = 'idle' | 'typing' | 'sending' | 'response' | 'logs' | 'done';

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-px animate-pulse bg-[#c4b5fd]" aria-hidden />
  );
}

function CodeLine({ line }: { line: string }) {
  const isCmd =
    line.startsWith('npm') ||
    line.startsWith('pip') ||
    line.startsWith('composer') ||
    line.startsWith('curl') ||
    line.startsWith('$');

  if (isCmd) {
    return (
      <div>
        <span className="text-[#71717a]">$ </span>
        <span className="text-[#e9d5ff]">{line.replace(/^\$ /, '')}</span>
      </div>
    );
  }
  if (line.trim() === '') return <div className="h-[1.75em]" />;
  return <div className="text-[#a1a1aa]">{line}</div>;
}

export function RailwayDeveloperPlayground({
  tab,
  labels,
  logs,
  autoPlay = false,
  interactive = false,
  onComplete,
}: {
  tab: number;
  labels: {
    install: string;
    sending: string;
    responseTitle: string;
    terminal: string;
    stream: string;
    signedDelivery: string;
    signaturePreview: string;
    complete: string;
    requestComplete: string;
  };
  logs: readonly string[];
  /** First auto sequence when orchestrator reaches developer phase */
  autoPlay?: boolean;
  /** Tab switches re-type (after events done or auto finished) */
  interactive?: boolean;
  onComplete?: () => void;
}) {
  const [runId, setRunId] = useState(0);
  const completedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const tabRef = useRef(tab);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [logLines, setLogLines] = useState(0);
  const [sigTyped, setSigTyped] = useState('');

  const snippet = SNIPPETS[tab] ?? SNIPPETS[0];
  const fullSignature = labels.signaturePreview;

  const startRun = useCallback(() => {
    setTyped('');
    setLogLines(0);
    setSigTyped('');
    setPhase('typing');
    setRunId((id) => id + 1);
  }, []);

  useEffect(() => {
    if (!autoPlay || autoStartedRef.current) return;
    autoStartedRef.current = true;
    completedRef.current = false;
    startRun();
  }, [autoPlay, startRun]);

  useEffect(() => {
    if (!interactive) {
      tabRef.current = tab;
      return;
    }
    if (tabRef.current !== tab) {
      tabRef.current = tab;
      completedRef.current = false;
      startRun();
    }
  }, [tab, interactive, startRun]);

  useEffect(() => {
    if (phase === 'idle') return;
    if (phase === 'done') return;

    if (phase === 'typing') {
      if (typed.length < snippet.length) {
        const t = setTimeout(() => setTyped(snippet.slice(0, typed.length + 1)), 11);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('sending'), 320);
      return () => clearTimeout(t);
    }

    if (phase === 'sending') {
      const t = setTimeout(() => setPhase('response'), 680);
      return () => clearTimeout(t);
    }

    if (phase === 'response') {
      const t = setTimeout(() => setPhase('logs'), 450);
      return () => clearTimeout(t);
    }

    if (phase === 'logs') {
      if (logLines < logs.length) {
        const t = setTimeout(() => setLogLines((n) => n + 1), 480);
        return () => clearTimeout(t);
      }
      setPhase('done');
      return;
    }
  }, [phase, typed, snippet, logLines, logs.length, runId]);

  useEffect(() => {
    if (phase !== 'done') return;
    if (sigTyped.length < fullSignature.length) {
      const t = setTimeout(() => setSigTyped(fullSignature.slice(0, sigTyped.length + 1)), 9);
      return () => clearTimeout(t);
    }
    if (autoPlay && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [autoPlay, phase, sigTyped, fullSignature, onComplete]);

  const isTyping = phase === 'typing';
  const displayCode =
    phase === 'idle' ? '' : phase === 'done' ? snippet : typed;
  const showResponse = phase === 'response' || phase === 'logs' || phase === 'done';
  const showLogs = phase === 'logs' || phase === 'done';
  const isDone = phase === 'done';

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a090f] font-mono text-[13px] shadow-[0_0_60px_-15px_rgba(139,92,246,0.4)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#ef4444]/80" />
        <span className="h-2 w-2 rounded-full bg-[#eab308]/80" />
        <span className="h-2 w-2 rounded-full bg-[#22c55e]/80" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-[#52525b]">{labels.install}</span>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-[#52525b]">POST /v1/checkout/sessions</span>
        <AnimatePresence mode="wait">
          {phase === 'sending' ? (
            <motion.span
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-medium text-[#fbbf24]"
            >
              {labels.sending}
            </motion.span>
          ) : isDone ? (
            <motion.span
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[10px] font-medium text-[#c4b5fd]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
              {labels.complete}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <pre className="min-h-[10.5rem] overflow-x-auto border-b border-white/[0.06] p-5 leading-[1.75]">
        {displayCode.length === 0 && phase === 'idle' ? (
          <span className="text-[#3f3f46]">—</span>
        ) : (
          displayCode.split('\n').map((line, i) => (
            <div key={`${tab}-${runId}-${i}`}>
              <CodeLine line={line} />
            </div>
          ))
        )}
        {isTyping ? <Cursor /> : null}
      </pre>

      <AnimatePresence>
        {showResponse ? (
          <motion.div
            key={`response-${runId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/[0.06] bg-[#0f0d14]/80"
          >
            <p className="border-b border-white/[0.04] px-4 py-2 text-[10px] text-[#4ade80]">{labels.responseTitle}</p>
            <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-[#a7f3d0]">{RESPONSE}</pre>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showLogs ? (
          <motion.div
            key={`logs-${runId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-0 sm:grid-cols-2"
          >
            <div className="border-b border-white/[0.06] p-4 sm:border-b-0 sm:border-r">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#71717a]">{labels.terminal}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase',
                    isDone
                      ? 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]'
                      : 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]',
                  )}
                >
                  <span className={cn('h-1 w-1 rounded-full', isDone ? 'bg-[#a78bfa]' : 'animate-pulse bg-[#4ade80]')} />
                  {labels.stream}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                {logs.slice(0, logLines).map((line) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      line.startsWith('payment') || line.startsWith('checkout')
                        ? 'text-[#c4b5fd]'
                        : line.includes('200')
                          ? 'text-[#4ade80]'
                          : 'text-[#71717a]',
                    )}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <span className="text-[10px] font-medium text-[#71717a]">{labels.signedDelivery}</span>
              <pre className="mt-3 min-h-[3.5rem] whitespace-pre-wrap text-[10px] leading-relaxed text-[#52525b]">
                {isDone ? (
                  <>
                    {sigTyped}
                    {sigTyped.length < fullSignature.length ? <Cursor /> : null}
                  </>
                ) : (
                  <span className="text-[#3f3f46]">—</span>
                )}
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isDone && sigTyped.length >= fullSignature.length ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-[#8b5cf6]/25 bg-[#8b5cf6]/10 py-2.5 text-center text-[10px] font-medium text-[#c4b5fd]"
          >
            ✓ {labels.requestComplete}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
