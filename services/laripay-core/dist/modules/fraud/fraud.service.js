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
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FraudService = class FraudService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scoreTransaction(input) {
        const rules = {};
        let score = 0;
        if (input.ipAddress?.startsWith('10.') || input.ipAddress === '127.0.0.1') {
            score += 5;
            rules.privateIp = true;
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await this.prisma.paymentIntent.count({
            where: {
                merchantId: input.merchantId,
                createdAt: { gte: oneHourAgo },
            },
        });
        if (recentCount > 20) {
            score += 40;
            rules.velocityExceeded = { count: recentCount, window: '1h' };
        }
        else if (recentCount > 10) {
            score += 20;
            rules.velocityElevated = { count: recentCount, window: '1h' };
        }
        if (input.amount >= 5000) {
            score += 15;
            rules.highAmount = input.amount;
        }
        let decision = 'allow';
        if (score >= 60)
            decision = 'block';
        else if (score >= 30)
            decision = 'review';
        await this.prisma.fraudCheck.create({
            data: {
                merchantId: input.merchantId,
                paymentId: input.paymentId,
                score,
                decision,
                ipAddress: input.ipAddress,
                deviceFp: input.deviceFingerprint,
                rules: rules,
            },
        });
        return { score, decision, rules };
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FraudService);
//# sourceMappingURL=fraud.service.js.map