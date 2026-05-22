export type PaymentBrandId = 'google-pay' | 'apple-pay' | 'tbc' | 'bog';

export const PAYMENT_BRANDS: Record<
  PaymentBrandId,
  { src: string; width: number; height: number; className?: string; variant?: 'official' }
> = {
  'google-pay': {
    src: '/brands/google-pay-official.png',
    width: 120,
    height: 48,
    variant: 'official',
  },
  'apple-pay': {
    src: '/brands/apple-pay-official.png',
    width: 100,
    height: 44,
    variant: 'official',
  },
  tbc: {
    src: '/brands/tbc-official.png',
    width: 180,
    height: 48,
    variant: 'official',
  },
  bog: {
    src: '/brands/bog-official.png',
    width: 160,
    height: 48,
    variant: 'official',
  },
};
