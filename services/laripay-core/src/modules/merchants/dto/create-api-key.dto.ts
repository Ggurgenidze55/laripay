import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @IsIn(['test', 'live'])
  mode!: 'test' | 'live';

  @IsOptional()
  @IsString()
  name?: string;
}
