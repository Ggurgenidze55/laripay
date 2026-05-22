import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@ApiTags('payments')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('v1/payment-intents')
  createIntent(
    @Req() req: RequestWithAuth,
    @Body() dto: CreateIntentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.createIntent(req.merchantId!, dto, idempotencyKey, req.ip);
  }

  @Get('v1/payment-intents/:id')
  getIntent(@Req() req: RequestWithAuth, @Param('id') id: string) {
    return this.payments.getIntent(req.merchantId!, id);
  }

  @Post('v1/payment-intents/:id/authorize')
  authorize(@Req() req: RequestWithAuth, @Param('id') id: string) {
    return this.payments.authorize(req.merchantId!, id, req.ip);
  }

  @Post('v1/payment-intents/:id/capture')
  capture(@Req() req: RequestWithAuth, @Param('id') id: string) {
    return this.payments.capture(req.merchantId!, id);
  }

  @Post('v1/payments/:id/refund')
  refund(
    @Req() req: RequestWithAuth,
    @Param('id') id: string,
    @Body() body: { amount?: number },
  ) {
    return this.payments.refund(req.merchantId!, id, body?.amount);
  }

  @Post('v1/payment-links')
  createLink(@Req() req: RequestWithAuth, @Body() body: { amount?: number; currency?: string }) {
    return this.payments.createPaymentLink(req.merchantId!, body.amount, body.currency);
  }

  @Post('v1/checkout/sessions')
  checkoutSession(
    @Req() req: RequestWithAuth,
    @Body() dto: CreateCheckoutSessionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.createCheckoutSession(req.merchantId!, dto, idempotencyKey, req.ip);
  }
}
