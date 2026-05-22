'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function CodeBlock({
  children,
  title,
  className,
}: {
  children: string;
  title?: string;
  className?: string;
}) {
  const lines = children.split('\n');
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border-strong bg-surface-code font-mono text-[13px] leading-relaxed shadow-lift',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        {title && <span className="ml-3 text-[10px] uppercase tracking-widest text-foreground-muted/80">{title}</span>}
      </div>
      <pre className="overflow-x-auto p-4">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="select-none w-6 text-right text-[11px] text-foreground-muted/60">{i + 1}</span>
            <code className="text-foreground">
              <SyntaxLine line={line} />
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

function SyntaxLine({ line }: { line: string }) {
  if (line.startsWith('//') || line.startsWith('#')) {
    return <span className="text-foreground-muted/80">{line}</span>;
  }
  const parts = line.split(/(".*?"|'.*?'|`.*?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"') || part.startsWith("'")) {
          return (
            <span key={i} className="text-emerald-700 dark:text-emerald-400/90">
              {part}
            </span>
          );
        }
        if (part.includes('POST') || part.includes('GET')) {
          return (
            <span key={i} className="text-accent-cyan">
              {part}
            </span>
          );
        }
        if (/\b(await|const|return|import|from|async)\b/.test(part)) {
          return (
            <span key={i}>
              {part.split(/(\b(?:await|const|return|import|from|async)\b)/g).map((p, j) =>
                /^(await|const|return|import|from|async)$/.test(p) ? (
                  <span key={j} className="text-accent-violet">
                    {p}
                  </span>
                ) : (
                  <span key={j}>{p}</span>
                ),
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function TerminalCursor() {
  return (
    <motion.span
      className="inline-block h-4 w-0.5 bg-accent-cyan align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.7, repeat: Infinity }}
    />
  );
}

export function RequestStatus({
  phase,
}: {
  phase: 'idle' | 'sending' | 'success';
}) {
  const { t } = useLocale();
  const rs = t.landing.requestStatus;
  const label =
    phase === 'sending' ? rs.sending : phase === 'success' ? rs.success : rs.ready;
  const color =
    phase === 'success' ? 'text-emerald-400' : phase === 'sending' ? 'text-amber-400' : 'text-foreground-muted';

  return (
    <div className={cn('flex items-center gap-2 font-mono text-[11px]', color)}>
      {phase === 'sending' && (
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}
      {phase === 'success' && <span className="text-emerald-400">●</span>}
      {label}
    </div>
  );
}
