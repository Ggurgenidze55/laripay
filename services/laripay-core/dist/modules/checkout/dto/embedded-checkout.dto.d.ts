import { CreateOrderDto } from './create-order.dto';
export declare class EmbeddedCheckoutDto extends CreateOrderDto {
    options?: Record<string, unknown>;
    params?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    messages?: Record<string, unknown>;
    fields_custom?: Record<string, unknown>;
    css_variable?: Record<string, unknown>;
    methods?: string[];
}
