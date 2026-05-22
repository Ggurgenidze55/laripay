import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { WebhooksService } from './webhooks.service';
import { RegisterEndpointDto } from './dto/register-endpoint.dto';

@ApiTags('webhooks')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('endpoints')
  register(@Req() req: RequestWithAuth, @Body() dto: RegisterEndpointDto) {
    return this.webhooks.registerEndpoint(req.merchantId!, dto);
  }

  @Get('endpoints')
  listEndpoints(@Req() req: RequestWithAuth) {
    return this.webhooks.listEndpoints(req.merchantId!);
  }

  @Get('deliveries')
  listDeliveries(@Req() req: RequestWithAuth) {
    return this.webhooks.listDeliveries(req.merchantId!);
  }
}
