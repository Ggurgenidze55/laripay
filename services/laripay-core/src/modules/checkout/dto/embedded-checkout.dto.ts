import { IsArray, IsObject, IsOptional } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class EmbeddedCheckoutDto extends CreateOrderDto {
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  messages?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  fields_custom?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  css_variable?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  methods?: string[];
}
