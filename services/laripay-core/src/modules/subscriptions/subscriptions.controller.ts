import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@Controller('v1')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('subscription-plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptions.createPlan(dto);
  }

  @Public()
  @Get('subscription-plans')
  listPlans() {
    return this.subscriptions.listPlans();
  }

  @Public()
  @Get('subscription-plans/:code')
  getPlan(@Param('code') code: string) {
    return this.subscriptions.getPlan(code);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('subscription-plans/:code')
  updatePlan(@Param('code') code: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.subscriptions.updatePlan(code, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('subscription-plans/:code')
  deletePlan(@Param('code') code: string) {
    return this.subscriptions.deletePlan(code);
  }

  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  @Post('subscriptions')
  create(@Req() req: RequestWithAuth, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.createSubscription(req.merchantId!, dto);
  }
}
