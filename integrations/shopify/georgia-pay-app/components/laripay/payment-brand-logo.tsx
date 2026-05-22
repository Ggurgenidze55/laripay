import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PAYMENT_BRANDS, type PaymentBrandId } from '@/lib/payment-brands';

type Props = {
  brand: PaymentBrandId;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Force transparent presentation (no white pill) */
  transparent?: boolean;
};

const SCALE = { sm: 0.72, md: 1, lg: 1.15 } as const;

export function PaymentBrandLogo({ brand, className, size = 'md', transparent }: Props) {
  const config = PAYMENT_BRANDS[brand];
  const scale = SCALE[size];
  const w = Math.round(config.width * scale);
  const h = Math.round(config.height * scale);
  const isTransparent = transparent ?? config.transparent ?? false;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        !isTransparent &&
          'rounded-lg bg-white/90 px-3 py-2 shadow-sm ring-1 ring-black/5 dark:bg-white/95',
        config.className,
        className,
      )}
    >
      <Image
        src={config.src}
        alt=""
        width={w}
        height={h}
        className="h-auto max-h-full w-auto object-contain"
        aria-hidden
      />
    </span>
  );
}
