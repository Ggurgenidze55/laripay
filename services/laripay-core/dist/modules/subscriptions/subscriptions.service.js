"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPlan(dto) {
        const plan = await this.prisma.subscriptionPlan.create({
            data: {
                code: dto.code,
                name: dto.name,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
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
    async getPlan(code) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return this.serializePlan(plan);
    }
    async updatePlan(code, data) {
        const plan = await this.prisma.subscriptionPlan.update({
            where: { code },
            data: {
                name: data.name,
                amount: data.amount != null ? (0, decimal_util_1.toDecimal)(data.amount) : undefined,
                currency: data.currency,
                interval: data.interval,
                usageBased: data.usageBased,
            },
        });
        return this.serializePlan(plan);
    }
    async deletePlan(code) {
        await this.prisma.subscriptionPlan.update({
            where: { code },
            data: { active: false },
        });
        return { deleted: true };
    }
    async createSubscription(merchantId, dto) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: dto.planCode } });
        if (!plan?.active)
            throw new common_1.NotFoundException('Plan not found');
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.interval === 'year') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }
        else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        const sub = await this.prisma.subscription.create({
            data: {
                merchantId,
                planId: plan.id,
                status: client_1.SubscriptionStatus.ACTIVE,
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
    serializePlan(plan) {
        return {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            amount: (0, decimal_util_1.decimalToNumber)(plan.amount),
            currency: plan.currency,
            interval: plan.interval,
            usage_based: plan.usageBased,
            active: plan.active,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map