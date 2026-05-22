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
exports.MerchantsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_2 = require("../../common/crypto");
let MerchantsService = class MerchantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onboardMerchant(userId, dto) {
        const slug = dto.slug ||
            dto.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 48);
        const existing = await this.prisma.merchant.findFirst({
            where: { OR: [{ email: dto.email }, { slug }] },
        });
        if (existing)
            throw new common_1.ConflictException('Merchant email or slug already exists');
        const webhookSecret = (0, crypto_1.randomBytes)(24).toString('base64url');
        const merchant = await this.prisma.merchant.create({
            data: {
                name: dto.name,
                email: dto.email,
                slug,
                status: client_1.MerchantStatus.PENDING,
                webhookSecret,
            },
        });
        await this.prisma.merchantUser.create({
            data: {
                merchantId: merchant.id,
                userId,
                role: client_1.UserRole.MERCHANT,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: client_1.UserRole.MERCHANT },
        });
        const wallet = await this.prisma.wallet.create({
            data: { merchantId: merchant.id, currency: 'GEL' },
        });
        for (const type of [
            client_1.LedgerAccountType.MERCHANT_AVAILABLE,
            client_1.LedgerAccountType.MERCHANT_PENDING,
            client_1.LedgerAccountType.PAYOUT_RESERVE,
        ]) {
            await this.prisma.ledgerAccount.create({
                data: {
                    walletId: wallet.id,
                    merchantId: merchant.id,
                    type,
                    currency: 'GEL',
                },
            });
        }
        await this.prisma.auditLog.create({
            data: {
                action: client_1.AuditAction.CREATE,
                actorId: userId,
                merchantId: merchant.id,
                entityType: 'merchant',
                entityId: merchant.id,
                metadata: { event: 'onboard' },
            },
        });
        return merchant;
    }
    async createApiKey(merchantId, dto) {
        const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        const fullKey = (0, crypto_2.generateSecretKey)(dto.mode);
        const apiKey = await this.prisma.apiKey.create({
            data: {
                merchantId,
                keyPrefix: fullKey.slice(0, 12),
                keyHash: (0, crypto_2.hashApiKey)(fullKey),
                mode: dto.mode,
                name: dto.name,
                scopes: ['payments', 'webhooks'],
            },
        });
        return {
            id: apiKey.id,
            key: fullKey,
            mode: apiKey.mode,
            prefix: apiKey.keyPrefix,
            createdAt: apiKey.createdAt,
            warning: 'Store this key securely; it will not be shown again.',
        };
    }
    async getMerchant(merchantId) {
        const merchant = await this.prisma.merchant.findUnique({
            where: { id: merchantId },
            include: { apiKeys: { where: { revokedAt: null }, select: { id: true, keyPrefix: true, mode: true, name: true, lastUsedAt: true, createdAt: true } } },
        });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        return merchant;
    }
};
exports.MerchantsService = MerchantsService;
exports.MerchantsService = MerchantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantsService);
//# sourceMappingURL=merchants.service.js.map