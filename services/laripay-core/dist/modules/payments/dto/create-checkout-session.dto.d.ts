export declare class CreateCheckoutSessionDto {
    amount: number;
    currency?: string;
    success_url: string;
    successUrl?: string;
    cancel_url?: string;
    cancelUrl?: string;
    provider?: string;
    client_reference_id?: string;
    clientReferenceId?: string;
    idempotency_key?: string;
    metadata?: Record<string, unknown>;
}
