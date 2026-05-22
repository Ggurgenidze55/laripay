'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { Badge } from '@/components/ui/badge';
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

const LOGS = [
  '$ laripay listen --forward-to localhost:3000/webhook',
  '→ Ready. Waiting for events...',
  'checkout.session.completed',
  'payment_intent.processing',
  'payment.succeeded',
  'webhook.delivered 200 OK (42ms)',
];

const TABS: { id: Lang; label: string }[] = [
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'curl', label: 'cURL' },
];

export function DeveloperExperience() {
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
  }, []);

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
  }, [phase]);

  return (
    <SectionShell id="developers" wide>
      <AmbientOrbs />
      <div ref={sectionRef} className="relative min-h-[130vh]">
        <SectionHeader
          eyebrow="Developer experience"
          title="APIs that feel alive in production"
          description="Typing simulations, signed webhooks, SDK tabs — the same developer-first polish as global infrastructure leaders."
        />

        <div ref={pinRef}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="space-y-8 lg:sticky lg:top-28">
                <div className="relative flex flex-wrap gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLang(tab.id)}
                      className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        lang === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {lang === tab.id && (
                        <motion.span
                          layoutId="sdk-tab"
                          className="absolute inset-0 rounded-xl bg-white/[0.08] ring-1 ring-white/12 shadow-glow"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">{tab.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm leading-[1.75] text-white/42">
                  Under fifty lines from install to first successful GEL payment — sandbox and
                  production keys, typed responses, predictable errors.
                </p>
                <CodeBlock title="install">{`npm install @laripay/sdk`}</CodeBlock>
                <RequestStatus
                  phase={phase === 'typing' ? 'idle' : phase === 'sending' ? 'sending' : 'success'}
                />
              </div>
            </div>

            <div ref={editorRef} className="space-y-6 lg:col-span-8">
              <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#030308]/80 shadow-lift glow-border backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-accent-blue/20 px-2 py-0.5 font-mono text-[10px] font-medium text-accent-cyan">
                      POST
                    </span>
                    <span className="font-mono text-xs text-white/50">/v1/checkout/sessions</span>
                  </div>
                  {phase === 'sending' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-[10px] text-amber-400"
                    >
                      sending…
                    </motion.span>
                  )}
                </div>
                <div className="p-5 font-mono text-[13px] leading-relaxed">
                  <pre className="whitespace-pre-wrap text-white/82">
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
                    <CodeBlock title="← 200 application/json">{RESPONSE}</CodeBlock>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/[0.04]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-white/50">Terminal</span>
                    <Badge variant="live" pulse>
                      stream
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
                            ? 'text-accent-cyan'
                            : line.includes('200')
                              ? 'text-emerald-400'
                              : 'text-white/45'
                        }
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                  <span className="text-xs font-medium text-white/50">Signed delivery</span>
                  <pre className="mt-4 font-mono text-[11px] leading-relaxed text-white/48">
                    {`LariPay-Signature: t=1716…,v1=8f3a…
LariPay-Event: payment.succeeded`}
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
