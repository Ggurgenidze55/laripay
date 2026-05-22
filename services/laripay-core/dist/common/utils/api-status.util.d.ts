import { OrderStatus, PaymentStatus } from '@prisma/client';
export declare function mapPaymentStatus(status: PaymentStatus): string;
export declare function mapOrderStatus(status: OrderStatus): string;
