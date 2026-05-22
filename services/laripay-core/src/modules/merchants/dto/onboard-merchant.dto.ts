import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class OnboardMerchantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
