export declare class CreateIntentDto {
    amount: number;
    currency?: string;
    captureMethod?: string;
    clientReferenceId?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, unknown>;
}
