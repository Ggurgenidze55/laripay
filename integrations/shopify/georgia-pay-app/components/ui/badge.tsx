import { cn } from '@/lib/utils';

const styles = {
  default: 'bg-white/5 text-white/70 border-white/10',
  live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  accent: 'bg-accent-blue/10 text-accent-cyan border-accent-blue/30',
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
