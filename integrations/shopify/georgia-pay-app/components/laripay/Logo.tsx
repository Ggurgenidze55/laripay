import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  variant?: 'default' | 'light' | 'auto';
  className?: string;
};

/** LariPay — emerald mark + bold wordmark */
export function LariPayLogo({
  showWordmark = true,
  variant = 'default',
  className,
}: LogoProps) {
  const textClass =
    variant === 'light' ? 'text-white' : 'text-tx-primary dark:text-stone-50';

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm',
          variant === 'light' ? 'bg-white/20' : 'bg-accent',
        )}
        aria-hidden
      >
        ₾
      </span>
      {showWordmark && (
        <span className={cn('text-lg font-extrabold tracking-tight', textClass)}>LariPay</span>
      )}
    </span>
  );
}

/** @deprecated use LariPayLogo */
export const PaykaLogo = LariPayLogo;
