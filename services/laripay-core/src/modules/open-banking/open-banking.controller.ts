import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { OpenBankingService } from './open-banking.service';

@ApiTags('open-banking')
@Controller('v1/open-banking')
export class OpenBankingController {
  constructor(private readonly opb: OpenBankingService) {}

  @Public()
  @Get('banks')
  banks() {
    return this.opb.listBanks();
  }

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('sessions')
  create(@Req() req: RequestWithAuth, @Body() body: Record<string, unknown>) {
    return this.opb.createSession(req.merchantId!, body as {
      amount: number;
      currency?: string;
      bank?: string;
      success_url?: string;
    });
  }

  @Public()
  @Get('sca/:token')
  scaPage(
    @Param('token') token: string,
    @Query('bank') bank: string,
    @Res() res: Response,
  ) {
    res.type('html').send(this.opb.getScaPage(token, bank || 'tbc'));
  }

  @Public()
  @Post('sca/:token/approve')
  async approve(@Param('token') token: string, @Res() res: Response) {
    const result = await this.opb.approveSca(token);
    res.json(result);
  }
}
