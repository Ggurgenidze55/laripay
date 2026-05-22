import { ArrayNotEmpty, IsArray, IsString, IsUrl } from 'class-validator';

export class RegisterEndpointDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  events!: string[];
}
