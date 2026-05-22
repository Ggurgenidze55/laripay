import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  create(@Req() req: RequestWithAuth, @Body() body: Record<string, unknown>) {
    return this.customers.create(req.merchantId!, body as {
      email?: string;
      name?: string;
      phone?: string;
      metadata?: object;
    });
  }

  @Get()
  list(@Req() req: RequestWithAuth) {
    return this.customers.list(req.merchantId!);
  }

  @Get(':id')
  get(@Req() req: RequestWithAuth, @Param('id') id: string) {
    return this.customers.get(req.merchantId!, id);
  }
}
