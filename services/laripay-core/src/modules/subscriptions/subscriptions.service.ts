import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(dto: CreatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        code: dto.code,
        name: dto.name,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        interval: dto.interval || 'month',
        usageBased: dto.usageBased ?? false,
      },
    });
    return this.serializePlan(plan);
  }

  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({ where: { active: true } });
    return plans.map((p) => this.serializePlan(p));
  }

  async getPlan(code: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.serializePlan(plan);
  }

  async updatePlan(code: string, data: Partial<CreatePlanDto>) {
    const plan = await this.prisma.subscriptionPlan.update({
      where: { code },
      data: {
        name: data.name,
        amount: data.amount != null ? toDecimal(data.amount) : undefined,
        currency: data.currency,
        interval: data.interval,
        usageBased: data.usageBased,
      },
    });
    return this.serializePlan(plan);
  }

  async deletePlan(code: string) {
    await this.prisma.subscriptionPlan.update({
      where: { code },
      data: { active: false },
    });
    return { deleted: true };
  }

  async createSubscription(merchantId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: dto.planCode } });
    if (!plan?.active) throw new NotFoundException('Plan not found');

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const sub = await this.prisma.subscription.create({
      data: {
        merchantId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    return {
      id: sub.id,
      status: sub.status,
      plan: this.serializePlan(sub.plan),
      current_period_start: sub.currentPeriodStart,
      current_period_end: sub.currentPeriodEnd,
    };
  }

  private serializePlan(plan: {
    id: string;
    code: string;
    name: string;
    amount: { toString(): string };
    currency: string;
    interval: string;
    usageBased: boolean;
    active: boolean;
  }) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      amount: decimalToNumber(plan.amount as never),
      currency: plan.currency,
      interval: plan.interval,
      usage_based: plan.usageBased,
      active: plan.active,
    };
  }
}
