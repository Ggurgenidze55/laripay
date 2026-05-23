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
    <div className={cn('landing-code-block', className)}>
      <div className="landing-code-bar">
        <span className="landing-code-dot" />
        <span className="landing-code-dot" />
        <span className="landing-code-dot" />
        {title && (
          <span className="ml-3 text-[10px] uppercase tracking-widest text-[#475569]">{title}</span>
        )}
      </div>
      <pre className="overflow-x-auto p-5">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-6 select-none text-right text-[11px] text-[#475569]">{i + 1}</span>
            <code className="text-[#E2E8F0]">
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
    return <span className="text-[#475569]">{line}</span>;
  }
  const parts = line.split(/(".*?"|'.*?'|`.*?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
          return (
            <span key={i} className="text-[#34D399]">
              {part}
            </span>
          );
        }
        if (part.includes('POST') || part.includes('GET')) {
          return (
            <span key={i} className="text-[#60A5FA]">
              {part}
            </span>
          );
        }
        if (/\b\d+\b/.test(part) && !/\b(await|const|return|import|from|async)\b/.test(part)) {
          return (
            <span key={i}>
              {part.split(/(\b\d+\b)/g).map((p, j) =>
                /^\d+$/.test(p) ? (
                  <span key={j} className="text-[#F59E0B]">
                    {p}
                  </span>
                ) : (
                  <KeywordSpan key={j} text={p} />
                ),
              )}
            </span>
          );
        }
        return <KeywordSpan key={i} text={part} />;
      })}
    </>
  );
}

function KeywordSpan({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\b(?:await|const|return|import|from|async|POST|GET)\b)/g).map((p, j) =>
        /^(await|const|return|import|from|async|POST|GET)$/.test(p) ? (
          <span key={j} className="text-[#60A5FA]">
            {p}
          </span>
        ) : (
          <span key={j}>{p}</span>
        ),
      )}
    </>
  );
}

export function TerminalCursor() {
  return (
    <motion.span
      className="inline-block h-4 w-0.5 bg-[#60A5FA] align-middle"
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
    phase === 'success'
      ? 'text-[#34D399]'
      : phase === 'sending'
        ? 'text-[#F59E0B]'
        : 'text-[#475569]';

  return (
    <div className={cn('flex items-center gap-2 font-mono text-[11px]', color)}>
      {phase === 'sending' && (
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}
      {phase === 'success' && <span className="text-[#34D399]">●</span>}
      {label}
    </div>
  );
}
