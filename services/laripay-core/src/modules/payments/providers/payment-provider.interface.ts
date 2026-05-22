import { PaymentStatus } from '@prisma/client';

export interface ProviderAuthorizeInput {
  intentId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderAuthorizeResult {
  status: PaymentStatus;
  providerRef: string;
}

export interface ProviderCaptureResult {
  status: PaymentStatus;
  providerRef: string;
}

export interface ProviderRefundResult {
  status: PaymentStatus;
  providerRef: string;
}

export interface PaymentProvider {
  readonly name: string;
  authorize(input: ProviderAuthorizeInput): Promise<ProviderAuthorizeResult>;
  capture(providerRef: string): Promise<ProviderCaptureResult>;
  refund(providerRef: string, amount: number): Promise<ProviderRefundResult>;
}
