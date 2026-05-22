import { IsArray, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  client_reference_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  methods?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
