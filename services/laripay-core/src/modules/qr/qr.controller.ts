import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { QrService } from './qr.service';

@ApiTags('qr')
@Controller('v1/qr')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('payments')
  create(@Req() req: RequestWithAuth, @Body() body: { amount: number; currency?: string; order_id?: string }) {
    return this.qr.create(req.merchantId!, body);
  }

  @Public()
  @Get(':code')
  resolve(@Param('code') code: string) {
    return this.qr.resolve(code);
  }
}
