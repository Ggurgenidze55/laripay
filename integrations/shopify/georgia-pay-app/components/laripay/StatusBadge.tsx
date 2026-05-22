import { cn } from '@/lib/utils';

const map: Record<string, string> = {
  succeeded: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  complete: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  processing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  canceled: 'bg-red-500/15 text-red-400 border-red-500/30',
  expired: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style = map[s] || 'bg-foreground/[0.05] text-foreground-muted border-border';

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        style,
      )}
    >
      {status}
    </span>
  );
}
