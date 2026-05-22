import { IsObject, IsOptional, IsString } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class RedirectCheckoutDto extends CreateOrderDto {
  @IsString()
  success_url!: string;

  @IsOptional()
  @IsString()
  cancel_url?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;
}
