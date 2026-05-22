import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RedirectCheckoutDto } from './dto/redirect-checkout.dto';
import { EmbeddedCheckoutDto } from './dto/embedded-checkout.dto';
import { DirectPaymentDto } from './dto/direct-payment.dto';

@ApiTags('checkout')
@Controller('v1')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('orders')
  createOrder(@Req() req: RequestWithAuth, @Body() dto: CreateOrderDto) {
    return this.checkout.createOrder(req.merchantId!, dto, req.ip);
  }

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('checkout/redirect')
  redirect(@Req() req: RequestWithAuth, @Body() dto: RedirectCheckoutDto) {
    return this.checkout.createRedirectCheckout(req.merchantId!, dto, req.ip);
  }

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('checkout/embedded')
  embedded(@Req() req: RequestWithAuth, @Body() dto: EmbeddedCheckoutDto) {
    return this.checkout.createEmbeddedSession(req.merchantId!, dto);
  }

  @Public()
  @Get('checkout/embedded/:token/config')
  embeddedConfig(@Param('token') token: string) {
    return this.checkout.getEmbeddedConfig(token);
  }

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('checkout/direct')
  direct(@Req() req: RequestWithAuth, @Body() dto: DirectPaymentDto) {
    return this.checkout.processDirectPayment(req.merchantId!, dto, req.ip);
  }

  @Public()
  @Get('checkout/hosted/:sessionId')
  async hostedPage(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const html = await this.checkout.getHostedCheckoutPage(sessionId);
    res.type('html').send(html);
  }

  @Public()
  @Post('checkout/hosted/:sessionId/pay')
  async hostedPay(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const result = await this.checkout.completeHostedPayment(sessionId);
    res.redirect(302, result.redirect);
  }

  @Public()
  @Get('checkout/3ds/:intentId')
  threeDs(@Param('intentId') intentId: string, @Res() res: Response) {
    res.type('html').send(
      `<html><body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
      <div style="text-align:center"><h1>3D Secure</h1><p>Mock authentication for intent ${intentId}</p>
      <p>Sandbox approved — return to merchant app.</p></div></body></html>`,
    );
  }
}
