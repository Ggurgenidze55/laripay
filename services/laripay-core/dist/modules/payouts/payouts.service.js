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
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
let PayoutsService = class PayoutsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(merchantId, dto, actorId) {
        const payout = await this.prisma.payout.create({
            data: {
                merchantId,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
                currency: dto.currency || 'GEL',
                status: client_1.PayoutStatus.PENDING,
                bankIban: dto.bankIban,
                scheduledAt: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: client_1.AuditAction.PAYOUT,
                actorId,
                merchantId,
                entityType: 'payout',
                entityId: payout.id,
                metadata: { amount: dto.amount },
            },
        });
        return this.serialize(payout);
    }
    async list(merchantId) {
        const payouts = await this.prisma.payout.findMany({
            where: { merchantId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return payouts.map((p) => this.serialize(p));
    }
    serialize(payout) {
        return {
            id: payout.id,
            amount: (0, decimal_util_1.decimalToNumber)(payout.amount),
            currency: payout.currency,
            status: payout.status,
            bank_iban: payout.bankIban,
            scheduled_at: payout.scheduledAt,
            created_at: payout.createdAt,
        };
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map