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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listMerchants() {
        const merchants = await this.prisma.merchant.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        return merchants.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            slug: m.slug,
            status: m.status,
            kyc_status: m.kycStatus,
            created_at: m.createdAt,
        }));
    }
    async approveMerchant(merchantId, actorId) {
        const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        const updated = await this.prisma.merchant.update({
            where: { id: merchantId },
            data: { status: client_1.MerchantStatus.ACTIVE },
        });
        await this.prisma.auditLog.create({
            data: {
                action: client_1.AuditAction.ADMIN,
                actorId,
                merchantId,
                entityType: 'merchant',
                entityId: merchantId,
                metadata: { event: 'approve' },
            },
        });
        return updated;
    }
    async listPayments(limit = 100) {
        const payments = await this.prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { merchant: { select: { id: true, name: true, slug: true } } },
        });
        return payments.map((p) => ({
            id: p.id,
            merchant_id: p.merchantId,
            merchant_name: p.merchant.name,
            status: p.status,
            amount: (0, decimal_util_1.decimalToNumber)(p.amount),
            currency: p.currency,
            provider: p.provider,
            created_at: p.createdAt,
        }));
    }
    async listAuditLogs(limit = 200) {
        const logs = await this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                actor: { select: { id: true, email: true } },
                merchant: { select: { id: true, name: true } },
            },
        });
        return logs.map((l) => ({
            id: l.id,
            action: l.action,
            actor: l.actor,
            merchant: l.merchant,
            entity_type: l.entityType,
            entity_id: l.entityId,
            metadata: l.metadata,
            created_at: l.createdAt,
        }));
    }
    async listDisputes(limit = 100) {
        const rows = await this.prisma.dispute.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { payment: { include: { merchant: { select: { name: true, slug: true } } } } },
        });
        return rows.map((d) => ({
            id: d.id,
            payment_id: d.paymentId,
            status: d.status,
            amount: (0, decimal_util_1.decimalToNumber)(d.amount),
            merchant: d.payment.merchant.name,
            created_at: d.createdAt,
        }));
    }
    async listFraudChecks(limit = 100) {
        return this.prisma.fraudCheck.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map