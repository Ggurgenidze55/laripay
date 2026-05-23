'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';
import { CodeBlock, RequestStatus, TerminalCursor } from './code-terminal';

type Lang = 'node' | 'python' | 'php' | 'curl';
type Phase = 'typing' | 'sending' | 'response' | 'webhook';

const SNIPPETS: Record<Lang, string> = {
  node: `const session = await laripay.checkout.sessions.create({
  amount: 2000,
  currency: 'GEL',
  provider: 'tbc',
  success_url: 'https://shop.ge/thanks',
});`,
  python: `session = laripay.checkout.Session.create(
    amount=2000,
    currency="GEL",
    provider="tbc",
)`,
  php: `$session = $laripay->checkout->sessions->create([
  'amount' => 2000,
  'currency' => 'GEL',
]);`,
  curl: `curl -X POST https://api.laripay.ai/v1/checkout/sessions \\
  -H "Authorization: Bearer sk_live_..." \\
  -d '{"amount":2000,"currency":"GEL"}'`,
};

const RESPONSE = `{
  "id": "cs_a1b2c3d4",
  "object": "checkout.session",
  "amount": 2000,
  "currency": "GEL",
  "status": "succeeded",
  "payment_id": "pay_9f2c..."
}`;

const TAB_IDS: Lang[] = ['node', 'python', 'php', 'curl'];

export function DeveloperExperience() {
  const { belowLg, ready } = useViewport();
  const reduced = useReducedMotion();
  const useScrollPin = ready && !reduced && !belowLg;
  const { t } = useLocale();
  const dx = t.landing.developerExperience;
  const LOGS = dx.logs;
  const TABS = TAB_IDS.map((id) => ({ id, label: dx.tabs[id] }));
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const inView = useInView(editorRef, { margin: '-20%' });

  const [lang, setLang] = useState<Lang>('node');
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [logLines, setLogLines] = useState(1);
  const [cycle, setCycle] = useState(0);
  const full = SNIPPETS[lang];

  useEffect(() => {
    if (!useScrollPin) return;
    registerGsap();
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 8%',
        end: '+=100%',
        pin: pin,
        pinSpacing: true,
        anticipatePin: 1,
      });
    }, section);

    return () => ctx.revert();
  }, [useScrollPin]);

  useEffect(() => {
    setTyped('');
    setPhase('typing');
    setLogLines(1);
  }, [lang, cycle]);

  useEffect(() => {
    if (!inView || phase !== 'typing') return;
    if (typed.length >= full.length) {
      const t = setTimeout(() => setPhase('sending'), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 12);
    return () => clearTimeout(t);
  }, [typed, full, phase, inView]);

  useEffect(() => {
    if (phase === 'sending') {
      const t = setTimeout(() => setPhase('response'), 750);
      return () => clearTimeout(t);
    }
    if (phase === 'response') {
      const t = setTimeout(() => setPhase('webhook'), 1100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'webhook') return;
    const t = setInterval(() => setLogLines((n) => Math.min(n + 1, LOGS.length)), 550);
    const done = setTimeout(() => {
      setPhase('typing');
      setCycle((c) => c + 1);
    }, 4000);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [phase, LOGS.length]);

  return (
    <SectionShell id="developers" wide tone="surface">
      <div
        ref={sectionRef}
        className={cn('relative', useScrollPin ? 'min-h-[130vh]' : 'min-h-0')}
      >
        <SectionHeader eyebrow={dx.eyebrow} title={dx.title} description={dx.description} />

        <div ref={pinRef}>
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-12">
            <div className="lg:col-span-4">
              <div className="space-y-8 lg:sticky lg:top-28">
                <motion.div className="relative flex flex-wrap gap-2 rounded-card border border-bd-default bg-bg-subtle p-2 dark:border-bd-default dark:bg-bg-hover">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLang(tab.id)}
                      className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        lang === tab.id ? 'text-tx-primary dark:text-[#F1F5F9]' : 'text-tx-secondary hover:text-tx-primary'
                      }`}
                    >
                      {lang === tab.id && (
                        <motion.span
                          layoutId="sdk-tab"
                          className="absolute inset-0 rounded-btn bg-bg-surface ring-1 ring-bd-default dark:bg-[#141417] dark:ring-bd-default"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">{tab.label}</span>
                    </button>
                  ))}
                </motion.div>
                <p className="text-sm leading-[1.75] text-tx-body dark:text-tx-body">{dx.blurb}</p>
                <CodeBlock title={dx.install}>{`npm install @laripay/sdk`}</CodeBlock>
                <RequestStatus
                  phase={phase === 'typing' ? 'idle' : phase === 'sending' ? 'sending' : 'success'}
                />
              </div>
            </div>

            <div ref={editorRef} className="space-y-6 lg:col-span-8">
              <div className="landing-code-block overflow-hidden">
                <div className="landing-code-bar">
                  <span className="landing-code-dot" />
                  <span className="landing-code-dot" />
                  <span className="landing-code-dot" />
                  <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">
                    POST /v1/checkout/sessions
                  </span>
                  {phase === 'sending' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-auto font-mono text-[10px] text-[#F59E0B]"
                    >
                      {dx.sending}
                    </motion.span>
                  )}
                </div>
                <div className="p-5 font-mono text-[13px] leading-relaxed">
                  <pre className="whitespace-pre-wrap text-[#E2E8F0]">
                    {typed}
                    {phase === 'typing' && <TerminalCursor />}
                  </pre>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {(phase === 'response' || phase === 'webhook') && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                    transition={{ duration: 0.45 }}
                  >
                    <CodeBlock title={dx.responseTitle}>{RESPONSE}</CodeBlock>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="landing-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-tx-secondary dark:text-tx-secondary">{dx.terminal}</span>
                    <Badge variant="live" pulse>
                      {dx.stream}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {LOGS.slice(0, logLines).map((line) => (
                      <motion.div
                        key={`${line}-${logLines}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={
                          line.startsWith('payment') || line.startsWith('checkout')
                            ? 'text-accent'
                            : line.includes('200')
                              ? 'text-success'
                              : 'text-tx-muted dark:text-tx-muted'
                        }
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="landing-card p-5">
                  <span className="text-xs font-medium text-tx-secondary dark:text-tx-secondary">{dx.signedDelivery}</span>
                  <pre className="mt-4 font-mono text-[11px] leading-relaxed text-tx-muted dark:text-tx-muted">
                    {dx.signaturePreview}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
