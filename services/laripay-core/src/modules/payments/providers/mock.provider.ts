import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import {
  PaymentProvider,
  ProviderAuthorizeInput,
  ProviderAuthorizeResult,
  ProviderCaptureResult,
  ProviderRefundResult,
} from './payment-provider.interface';

@Injectable()
export class MockProvider implements PaymentProvider {
  readonly name = 'mock';

  async authorize(input: ProviderAuthorizeInput): Promise<ProviderAuthorizeResult> {
    return {
      status: PaymentStatus.AUTHORIZED,
      providerRef: `mock_auth_${input.intentId}`,
    };
  }

  async capture(providerRef: string): Promise<ProviderCaptureResult> {
    return {
      status: PaymentStatus.SUCCEEDED,
      providerRef: providerRef.replace('auth', 'cap'),
    };
  }

  async refund(providerRef: string, _amount: number): Promise<ProviderRefundResult> {
    return {
      status: PaymentStatus.REFUNDED,
      providerRef: `${providerRef}_refund`,
    };
  }
}
