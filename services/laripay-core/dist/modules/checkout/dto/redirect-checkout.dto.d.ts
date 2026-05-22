import { CreateOrderDto } from './create-order.dto';
export declare class RedirectCheckoutDto extends CreateOrderDto {
    success_url: string;
    cancel_url?: string;
    provider?: string;
    branding?: Record<string, unknown>;
}
