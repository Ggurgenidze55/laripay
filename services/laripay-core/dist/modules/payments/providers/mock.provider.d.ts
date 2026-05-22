import { PaymentProvider, ProviderAuthorizeInput, ProviderAuthorizeResult, ProviderCaptureResult, ProviderRefundResult } from './payment-provider.interface';
export declare class MockProvider implements PaymentProvider {
    readonly name = "mock";
    authorize(input: ProviderAuthorizeInput): Promise<ProviderAuthorizeResult>;
    capture(providerRef: string): Promise<ProviderCaptureResult>;
    refund(providerRef: string, _amount: number): Promise<ProviderRefundResult>;
}
