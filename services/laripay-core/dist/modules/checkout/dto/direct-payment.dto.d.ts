export declare class DirectPaymentDto {
    order_id: string;
    card_token?: string;
    encrypted_payload?: string;
    wallet_token?: string;
    payment_method?: 'card' | 'apple_pay' | 'google_pay';
    amount?: number;
}
