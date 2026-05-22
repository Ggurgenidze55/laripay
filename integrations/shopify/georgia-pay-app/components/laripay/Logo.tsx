import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  variant?: 'default' | 'light';
  className?: string;
};

/** LariPay.ai brand mark */
export function LariPayLogo({
  size = 36,
  showWordmark = true,
  variant = 'default',
  className,
}: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-white/90';
  const subColor = variant === 'light' ? 'text-white/50' : 'text-white/40';

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="laripay-grad" x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e3a8a" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#laripay-grad)" />
        <path d="M14 28V12h4v16h10v-4H18" fill="white" />
        <circle cx="30" cy="14" r="3" fill="#22d3ee" opacity="0.95" />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-tight">
          <span className={cn('text-sm font-semibold tracking-tight', textColor)}>
            LariPay<span className="text-accent-cyan">.ai</span>
          </span>
          <span className={cn('text-[10px] uppercase tracking-wider', subColor)}>
            Infrastructure
          </span>
        </span>
      )}
    </span>
  );
}

/** @deprecated use LariPayLogo */
export const PaykaLogo = LariPayLogo;
