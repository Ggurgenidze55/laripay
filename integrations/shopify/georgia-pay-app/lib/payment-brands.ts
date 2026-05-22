export type PaymentBrandId = 'google-pay' | 'apple-pay' | 'tbc' | 'bog';

export const PAYMENT_BRANDS: Record<
  PaymentBrandId,
  {
    src: string;
    width: number;
    height: number;
    className?: string;
    /** No white card behind the mark */
    transparent?: boolean;
  }
> = {
  'google-pay': {
    src: '/brands/google-pay-color.svg',
    width: 120,
    height: 40,
    transparent: true,
  },
  'apple-pay': {
    src: '/brands/apple-pay-mark.svg',
    width: 72,
    height: 30,
    className: 'text-foreground',
    transparent: true,
  },
  tbc: {
    src: '/brands/tbc-bank-mark.svg',
    width: 160,
    height: 38,
    transparent: true,
  },
  bog: {
    src: '/brands/bog-mark.svg',
    width: 120,
    height: 40,
    transparent: true,
  },
};
