'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RailwayEventStream } from './railway-event-stream';
import { RailwayDeveloperPlayground } from './railway-developer-playground';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">{children}</p>
  );
}

type OrchestratorPhase = 'idle' | 'events' | 'developer' | 'finished';

export function RailwayEventsDevSection({
  webhooks,
  dev,
  sdkTab,
  onSdkTabChange,
}: {
  webhooks: {
    eyebrow: string;
    title: string;
    description: string;
    eventStream: string;
    delivering: string;
    sending: string;
    complete: string;
    allDelivered: string;
    signature: string;
  };
  dev: {
    eyebrow: string;
    title: string;
    description: string;
    blurb: string;
    tabs: { node: string; python: string; php: string; curl: string };
    install: string;
    sending: string;
    complete: string;
    requestComplete: string;
    responseTitle: string;
    terminal: string;
    stream: string;
    signedDelivery: string;
    signaturePreview: string;
    logs: readonly string[];
  };
  sdkTab: number;
  onSdkTabChange: (index: number) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const inView = useInView(sectionRef, { once: true, margin: '-12%' });

  const [phase, setPhase] = useState<OrchestratorPhase>('idle');

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;
    setPhase('events');
  }, [inView]);

  const tabLabels = [dev.tabs.node, dev.tabs.python, dev.tabs.php, dev.tabs.curl];

  return (
    <section ref={sectionRef} className="border-t border-white/[0.06] bg-[#08070c] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b0a10]/80 p-5 sm:p-6 md:p-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            {/* Event system */}
            <div className="flex min-w-0 flex-col">
              <SectionLabel>{webhooks.eyebrow}</SectionLabel>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">{webhooks.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{webhooks.description}</p>
              <div className="mt-5 min-h-0 flex-1">
                <RailwayEventStream
                  active={phase === 'events'}
                  labels={{
                    eventStream: webhooks.eventStream,
                    delivering: webhooks.delivering,
                    sending: webhooks.sending,
                    complete: webhooks.complete,
                    allDelivered: webhooks.allDelivered,
                    signature: webhooks.signature,
                  }}
                  onComplete={() => setPhase('developer')}
                />
              </div>
            </div>

            {/* Developer experience */}
            <div className="flex min-w-0 flex-col">
              <SectionLabel>{dev.eyebrow}</SectionLabel>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">{dev.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{dev.description}</p>
              <p className="mt-2 text-xs text-[#71717a]">{dev.blurb}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tabLabels.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => onSdkTabChange(i)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      sdkTab === i
                        ? 'bg-[#8b5cf6]/20 text-[#e9d5ff] ring-1 ring-[#8b5cf6]/40'
                        : 'text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa]',
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-4 min-h-0 flex-1">
                <RailwayDeveloperPlayground
                  autoPlay={phase === 'developer'}
                  interactive={phase === 'developer' || phase === 'finished'}
                  tab={sdkTab}
                  logs={dev.logs}
                  labels={{
                    install: dev.install,
                    sending: dev.sending,
                    complete: dev.complete,
                    requestComplete: dev.requestComplete,
                    responseTitle: dev.responseTitle,
                    terminal: dev.terminal,
                    stream: dev.stream,
                    signedDelivery: dev.signedDelivery,
                    signaturePreview: dev.signaturePreview,
                  }}
                  onComplete={() => setPhase('finished')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
