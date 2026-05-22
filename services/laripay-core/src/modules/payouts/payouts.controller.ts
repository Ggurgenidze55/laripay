import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';

@ApiTags('payouts')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Post()
  create(@Req() req: RequestWithAuth, @Body() dto: CreatePayoutDto) {
    return this.payouts.create(req.merchantId!, dto);
  }

  @Get()
  list(@Req() req: RequestWithAuth) {
    return this.payouts.list(req.merchantId!);
  }
}
