import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayoutDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  bankIban?: string;
}
