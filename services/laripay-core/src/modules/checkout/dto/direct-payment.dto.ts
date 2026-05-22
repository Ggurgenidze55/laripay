import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DirectPaymentDto {
  @IsString()
  order_id!: string;

  @IsOptional()
  @IsString()
  card_token?: string;

  @IsOptional()
  @IsString()
  encrypted_payload?: string;

  @IsOptional()
  @IsString()
  wallet_token?: string;

  @IsOptional()
  @IsString()
  payment_method?: 'card' | 'apple_pay' | 'google_pay';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
