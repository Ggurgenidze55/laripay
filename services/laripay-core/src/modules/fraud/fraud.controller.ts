import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { FraudService } from './fraud.service';

@ApiTags('fraud')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/fraud')
export class FraudController {
  constructor(private readonly fraud: FraudService) {}

  @Post('score')
  score(
    @Req() req: RequestWithAuth,
    @Body() body: { amount: number; currency?: string; device_fp?: string },
  ) {
    return this.fraud.scoreTransaction({
      merchantId: req.merchantId!,
      amount: body.amount,
      currency: body.currency || 'GEL',
      ipAddress: req.ip,
      deviceFingerprint: body.device_fp,
    });
  }
}
