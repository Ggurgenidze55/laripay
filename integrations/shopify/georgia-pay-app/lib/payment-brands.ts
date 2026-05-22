export type PaymentBrandId = 'google-pay' | 'apple-pay' | 'tbc' | 'bog';

export const PAYMENT_BRANDS: Record<
  PaymentBrandId,
  { src: string; width: number; height: number; className?: string }
> = {
  'google-pay': {
    src: '/brands/google-pay-color.svg',
    width: 96,
    height: 40,
  },
  'apple-pay': {
    src: '/brands/apple-pay-mark.svg',
    width: 68,
    height: 28,
    className: 'text-foreground',
  },
  tbc: {
    src: '/brands/tbc-bank-mark.svg',
    width: 140,
    height: 34,
  },
  bog: {
    src: '/brands/bog-bank.svg',
    width: 150,
    height: 40,
  },
};
