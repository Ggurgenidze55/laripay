import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateIntentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  captureMethod?: string;

  @IsOptional()
  @IsString()
  clientReferenceId?: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
