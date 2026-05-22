import { OrderStatus, PaymentStatus } from '@prisma/client';

/** Public API status labels (Stripe/Flitt-style). */
export function mapPaymentStatus(status: PaymentStatus): string {
  if (status === PaymentStatus.SUCCEEDED) return 'approved';
  return status.toLowerCase();
}

export function mapOrderStatus(status: OrderStatus): string {
  return status.toLowerCase();
}
