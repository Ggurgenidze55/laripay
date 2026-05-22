import { cn } from '@/lib/utils';

const styles = {
  default: 'border-border-strong bg-surface-inset text-foreground-muted',
  live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  accent: 'border-accent-blue/35 bg-accent-blue/12 text-accent-blue dark:text-accent-cyan',
};

export function Badge({
  children,
  variant = 'default',
  pulse,
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        styles[variant],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      )}
      {children}
    </span>
  );
}
