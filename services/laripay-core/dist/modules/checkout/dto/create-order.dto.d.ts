export declare class CreateOrderDto {
    amount: number;
    currency?: string;
    client_reference_id?: string;
    description?: string;
    locale?: string;
    methods?: string[];
    metadata?: Record<string, unknown>;
}
