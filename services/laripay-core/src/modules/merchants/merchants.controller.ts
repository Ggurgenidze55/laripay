import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../../common/types/request.types';
import { MerchantsService } from './merchants.service';
import { OnboardMerchantDto } from './dto/onboard-merchant.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { MerchantId } from '../../common/decorators/merchant.decorator';

@ApiTags('merchants')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post('onboard')
  onboard(@Req() req: Request & { user: JwtPayload & { userId: string } }, @Body() dto: OnboardMerchantDto) {
    return this.merchants.onboardMerchant(req.user.userId, dto);
  }

  @Get('me')
  me(@MerchantId() merchantId: string) {
    return this.merchants.getMerchant(merchantId!);
  }

  @Post('api-keys')
  createApiKey(@MerchantId() merchantId: string, @Body() dto: CreateApiKeyDto) {
    return this.merchants.createApiKey(merchantId!, dto);
  }
}
