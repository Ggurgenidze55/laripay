import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  success_url!: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancel_url?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  client_reference_id?: string;

  @IsOptional()
  @IsString()
  clientReferenceId?: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
